import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck } from "lucide-react";

interface OtherServicesFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  selectedService: string;
}

const OtherServicesForm = ({ formData, onChange, selectedService }: OtherServicesFormProps) => {
  const serviceInfo = {
    idu: {
      title: "IDU - Identification Unique",
      description: "Numéro d'identification unique pour votre entreprise",
      price: "25 000 FCFA",
      delay: "5 à 7 jours"
    },
    ntd: {
      title: "NTD - Numéro de Télédéclarant",
      description: "Activation de votre compte télédéclarant DGI",
      price: "25 000 FCFA",
      delay: "3 à 5 jours"
    },
    domiciliation: {
      title: "Domiciliation commerciale",
      description: "Service de domiciliation de votre entreprise",
      price: "À partir de 50 000 FCFA/an",
      delay: "2 à 3 jours"
    }
  };

  const info = serviceInfo[selectedService as keyof typeof serviceInfo];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          {info?.title}
        </CardTitle>
        <CardDescription>
          {info?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Nom de l'entreprise *</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e) => onChange('company_name', e.target.value)}
              placeholder="Nom de votre entreprise"
              required
            />
          </div>
          <div>
            <Label htmlFor="company_address">Adresse de l'entreprise *</Label>
            <Input
              id="company_address"
              value={formData.company_address || ''}
              onChange={(e) => onChange('company_address', e.target.value)}
              placeholder="Adresse complète"
              required
            />
          </div>
          {selectedService !== 'domiciliation' && (
            <>
              <div>
                <Label htmlFor="rccm_number">Numéro RCCM</Label>
                <Input
                  id="rccm_number"
                  value={formData.rccm_number || ''}
                  onChange={(e) => onChange('rccm_number', e.target.value)}
                  placeholder="Si disponible"
                />
              </div>
              <div>
                <Label htmlFor="ncc_number">Numéro NCC</Label>
                <Input
                  id="ncc_number"
                  value={formData.ncc_number || ''}
                  onChange={(e) => onChange('ncc_number', e.target.value)}
                  placeholder="Si disponible"
                />
              </div>
            </>
          )}
          {selectedService === 'domiciliation' && (
            <div>
              <Label htmlFor="duration">Durée souhaitée *</Label>
              <Select
                value={formData.duration || ''}
                onValueChange={(value) => onChange('duration', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la durée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 mois</SelectItem>
                  <SelectItem value="1year">1 an</SelectItem>
                  <SelectItem value="2years">2 ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="manager_name">Nom du gérant *</Label>
            <Input
              id="manager_name"
              value={formData.manager_name || ''}
              onChange={(e) => onChange('manager_name', e.target.value)}
              placeholder="Nom complet du gérant"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="additional_info">Informations complémentaires</Label>
          <Textarea
            id="additional_info"
            value={formData.additional_info || ''}
            onChange={(e) => onChange('additional_info', e.target.value)}
            placeholder="Précisez toute information utile pour votre demande..."
            rows={3}
          />
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Documents requis:</strong> RCCM, DFE, NCC (selon disponibilité)
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            <strong>Délai:</strong> {info?.delay}
          </p>
          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mt-2">
            Prix: {info?.price}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OtherServicesForm;
