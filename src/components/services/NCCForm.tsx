import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hash } from "lucide-react";

interface NCCFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const NCCForm = ({ formData, onChange }: NCCFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          NCC - Numéro Compte Contribuable
        </CardTitle>
        <CardDescription>
          Obtention de votre numéro d'identification fiscale
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
          <div>
            <Label htmlFor="rccm_number">Numéro RCCM</Label>
            <Input
              id="rccm_number"
              value={formData.rccm_number || ''}
              onChange={(e) => onChange('rccm_number', e.target.value)}
              placeholder="Si déjà disponible"
            />
          </div>
          <div>
            <Label htmlFor="dfe_number">Numéro DFE</Label>
            <Input
              id="dfe_number"
              value={formData.dfe_number || ''}
              onChange={(e) => onChange('dfe_number', e.target.value)}
              placeholder="Si déjà disponible"
            />
          </div>
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
          <div>
            <Label htmlFor="manager_id">CNI/Passeport du gérant *</Label>
            <Input
              id="manager_id"
              value={formData.manager_id || ''}
              onChange={(e) => onChange('manager_id', e.target.value)}
              placeholder="Numéro pièce d'identité"
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
            <strong>Documents requis:</strong> DFE, RCCM, CNI du gérant
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            <strong>Délai:</strong> 3 à 5 jours ouvrés
          </p>
          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mt-2">
            Prix: 25 000 FCFA
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NCCForm;
