import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, ArrowRight, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { contactFormSchema } from "@/lib/validations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const validation = contactFormSchema.safeParse(formData);
    if (!validation.success) {
      toast({ title: "Erreur de validation", description: validation.error.errors[0].message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    try {
      const { error } = await supabase.from('contact_messages').insert({ ...formData });
      if (error) throw error;
      toast({ title: "Message envoyé !", description: "Nous vous répondrons dans les plus brefs délais" });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue. Veuillez réessayer.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Phone, title: "Téléphone", details: ["+225 07 09 67 79 25", "+225 01 71 50 04 73"] },
    { icon: MessageCircle, title: "WhatsApp", details: ["+225 07 09 67 79 25"], action: { label: "Discuter sur WhatsApp", url: "https://wa.me/2250709677925" } },
    { icon: Mail, title: "Email", details: ["contact@legalform.ci", "monentreprise@legalform.ci"] },
    { icon: MapPin, title: "Adresse", details: ["BPM 387, Grand-Bassam", "ANCIENNE CIE, Côte d'Ivoire"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-white pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center max-w-3xl">
            <Badge className="bg-white/15 text-white border-white/20 backdrop-blur mb-5">{t('contact.title', 'Nous contacter')}</Badge>
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              Parlons de votre projet
            </h1>
            <p className="text-lg sm:text-xl text-white/85 leading-relaxed">
              Une équipe d'experts disponible 6j/7 pour répondre à toutes vos questions juridiques et entrepreneuriales.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          {/* Quick contact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 lg:mb-16 -mt-28 lg:-mt-40 relative">
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <Card key={info.title} className="border-2 hover:shadow-strong hover:-translate-y-1 transition-all bg-card">
                  <CardContent className="p-5">
                    <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
                    {info.details.map((d, i) => (
                      <p key={i} className="text-sm text-muted-foreground break-words">{d}</p>
                    ))}
                    {info.action && (
                      <a href={info.action.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center mt-3 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />{info.action.label}
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Form + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <Card className="border-2 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" /> Envoyez-nous un message
                  </CardTitle>
                  <CardDescription>Réponse garantie sous 24h ouvrées.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Votre nom" required className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="votre@email.com" required className="mt-1.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+225 XX XX XX XX XX" required className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="subject">Objet</Label>
                        <Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Objet de votre message" className="mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Décrivez votre projet ou votre demande..." rows={6} required className="mt-1.5" />
                    </div>
                    <Button type="submit" size="lg" className="w-full bg-gradient-primary text-white font-semibold shadow-premium" disabled={isSubmitting}>
                      {isSubmitting ? "Envoi en cours..." : <>Envoyer le message <ArrowRight className="ml-2 h-5 w-5" /></>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="bg-gradient-hero text-white border-0 shadow-strong">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5" />
                    <h3 className="font-heading font-bold text-lg">Horaires d'ouverture</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-white/80">Lundi - Vendredi</span><span className="font-semibold">8h - 18h</span></div>
                    <div className="flex justify-between"><span className="text-white/80">Samedi</span><span className="font-semibold">9h - 13h</span></div>
                    <div className="flex justify-between"><span className="text-white/80">Dimanche</span><span className="font-semibold">Fermé</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Headphones className="h-5 w-5 text-primary" />
                    <h3 className="font-heading font-bold text-lg">Besoin d'une réponse rapide ?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Notre assistant juridique LexIA est disponible 24/7 pour répondre instantanément à vos questions.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => document.querySelector<HTMLButtonElement>("[data-lexia-trigger]")?.click()}>
                    Discuter avec LexIA <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 overflow-hidden">
                <a href="https://maps.app.goo.gl/HNxpTdi9dZptmf8G9" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="aspect-video bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <iframe
                      title="Localisation Legal Form"
                      src="https://www.google.com/maps?q=Grand-Bassam,Cote+d'Ivoire&output=embed"
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">BPM 387, Grand-Bassam, ANCIENNE CIE, Côte d'Ivoire</p>
                    </div>
                  </CardContent>
                </a>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
