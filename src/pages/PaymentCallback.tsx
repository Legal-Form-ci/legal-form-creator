import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, RefreshCw, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { downloadReceiptPDF } from "@/utils/pdfGenerator";

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

interface PaymentDetails {
  transactionId: string;
  trackingNumber: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  description: string;
  receiptNumber: string;
  date: string;
}

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    // Get status from URL params (KkiaPay redirects with status)
    const statusParam = searchParams.get('status');
    const txId = searchParams.get('transaction_id') || searchParams.get('id') || searchParams.get('transactionId');
    const requestId = searchParams.get('request_id') || searchParams.get('requestId');
    const requestType = searchParams.get('request_type') || searchParams.get('type') || 'company';
    
    setTransactionId(txId);

    // Determine payment status from URL
    if (statusParam === 'approved' || statusParam === 'completed' || statusParam === 'success') {
      setStatus('success');
      // Verify payment on backend
      if (txId) {
        verifyPayment(txId, requestId, requestType);
      }
    } else if (statusParam === 'declined' || statusParam === 'cancelled' || statusParam === 'failed') {
      setStatus('failed');
    } else if (statusParam === 'pending') {
      setStatus('pending');
    } else if (txId) {
      // If we have a transaction ID but no clear status, verify it
      setStatus('loading');
      verifyPayment(txId, requestId, requestType);
    } else {
      // Default to pending if no clear status
      setStatus('pending');
    }
  }, [searchParams]);

  const verifyPayment = async (txId: string, requestId: string | null, requestType: string) => {
    if (verifying) return;
    setVerifying(true);
    
    try {
      // Call the verify-kkiapay-payment edge function
      const { data, error } = await supabase.functions.invoke('verify-kkiapay-payment', {
        body: {
          transactionId: txId,
          requestId: requestId,
          requestType: requestType
        }
      });

      if (error) {
        console.error('Verification error:', error);
        // Still show success if we got a success status in URL
        const statusParam = searchParams.get('status');
        if (statusParam === 'success' || statusParam === 'approved') {
          setStatus('success');
        }
      } else if (data) {
        console.log('Verification result:', data);
        if (data.status === 'approved' || data.paymentStatus === 'approved' || data.success) {
          setStatus('success');
          if (data.trackingNumber) {
            setTrackingNumber(data.trackingNumber);
          }
          // Store payment details for PDF generation
          if (data.paymentDetails) {
            setPaymentDetails({
              transactionId: txId,
              trackingNumber: data.trackingNumber || data.paymentDetails.trackingNumber || '',
              amount: data.paymentDetails.amount || 0,
              clientName: data.paymentDetails.clientName || '',
              clientEmail: data.paymentDetails.clientEmail || '',
              clientPhone: data.paymentDetails.clientPhone || '',
              clientCompany: data.paymentDetails.companyName || '',
              description: data.paymentDetails.description || 'Service Legal Form',
              receiptNumber: `REC-${Date.now().toString().slice(-8)}`,
              date: new Date().toISOString()
            });
          }
          toast({
            title: t('payment.successTitle', 'Paiement confirmé !'),
            description: t('payment.successDesc', 'Votre paiement a été vérifié avec succès.')
          });
        } else if (data.status === 'failed' || data.paymentStatus === 'failed') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      // Don't change status on error if we already have a success status
      const statusParam = searchParams.get('status');
      if (statusParam === 'success' || statusParam === 'approved') {
        setStatus('success');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloadingPDF(true);
    try {
      const receiptData = paymentDetails || {
        receiptNumber: `REC-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        clientName: 'Client',
        clientEmail: '',
        clientPhone: '',
        amount: 0,
        description: 'Service Legal Form',
        trackingNumber: trackingNumber || '',
        transactionId: transactionId || ''
      };

      downloadReceiptPDF(receiptData);
      
      toast({
        title: t('payment.receiptDownloaded', 'Reçu téléchargé'),
        description: t('payment.receiptDownloadedDesc', 'Votre reçu de paiement a été téléchargé.')
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: t('payment.receiptError', 'Erreur'),
        description: t('payment.receiptErrorDesc', 'Impossible de générer le reçu. Veuillez réessayer.'),
        variant: 'destructive'
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-20 w-20 text-primary animate-spin" />,
          title: t('payment.verifying', 'Vérification en cours...'),
          description: t('payment.verifyingDesc', 'Nous vérifions votre paiement auprès de notre système.'),
          color: "text-primary",
          bgColor: "bg-primary/5"
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-20 w-20 text-green-500" />,
          title: t('payment.successTitle', 'Paiement réussi !'),
          description: t('payment.successDesc', 'Votre paiement a été effectué avec succès. Votre demande est maintenant en cours de traitement par notre équipe.'),
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/20"
        };
      case 'failed':
        return {
          icon: <XCircle className="h-20 w-20 text-destructive" />,
          title: t('payment.failedTitle', 'Paiement échoué'),
          description: t('payment.failedDesc', 'Le paiement n\'a pas pu être complété. Veuillez réessayer ou contacter le support si le problème persiste.'),
          color: "text-destructive",
          bgColor: "bg-destructive/5"
        };
      case 'pending':
        return {
          icon: <Loader2 className="h-20 w-20 text-yellow-500" />,
          title: t('payment.pendingTitle', 'Paiement en attente'),
          description: t('payment.pendingDesc', 'Votre paiement est en cours de traitement. Vous recevrez une notification par email une fois confirmé.'),
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
          <Card className={`text-center shadow-lg ${content.bgColor}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-6">
                {content.icon}
              </div>
              <CardTitle className={`text-2xl md:text-3xl ${content.color}`}>
                {content.title}
              </CardTitle>
              <CardDescription className="text-base mt-3">
                {content.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(transactionId || trackingNumber) && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  {transactionId && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('payment.transactionRef', 'Référence de transaction')}:</span>
                      <br />
                      <span className="font-mono font-semibold">{transactionId}</span>
                    </p>
                  )}
                  {trackingNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('payment.trackingNumber', 'Numéro de suivi')}:</span>
                      <br />
                      <span className="font-mono font-semibold text-primary">{trackingNumber}</span>
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-3 pt-4">
                {status === 'success' && (
                  <Button 
                    onClick={handleDownloadReceipt}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                    size="lg"
                    disabled={downloadingPDF}
                  >
                    {downloadingPDF ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t('payment.downloadReceipt', 'Télécharger le reçu PDF')}
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate('/client/dashboard')}
                  className="w-full"
                  size="lg"
                >
                  {t('payment.goToDashboard', 'Accéder à mon tableau de bord')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {status === 'failed' && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full"
                    size="lg"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('payment.retry', 'Réessayer le paiement')}
                  </Button>
                )}
                
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  {t('payment.backHome', 'Retour à l\'accueil')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentCallback;
