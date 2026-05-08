import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface AdditionalServiceFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  selectedService: string;
}

const AdditionalServiceForm = ({ formData, onChange, selectedService }: AdditionalServiceFormProps) => {
  const getServiceTitle = () => {
    const titles: Record<string, string> = {
      structuration: "Structuration de Projet",
      formation: "Formation",
      financement: "Mobilisation de Financement",
      digitale: "Solutions Digitales",
      identite: "Identité Visuelle",
      comptabilite: "Comptabilité & Fiscalité",
    };
    return titles[selectedService] || "Service Additionnel";
  };

  const getServiceFields = () => {
    switch (selectedService) {
      case "structuration":
        return (
          <>
            <div>
              <Label htmlFor="project_name">Nom du projet *</Label>
              <Input
                id="project_name"
                value={formData.project_name || ""}
                onChange={(e) => onChange("project_name", e.target.value)}
                placeholder="Nom de votre projet"
                required
              />
            </div>
            <div>
              <Label htmlFor="project_description">Description du projet *</Label>
              <Textarea
                id="project_description"
                value={formData.project_description || ""}
                onChange={(e) => onChange("project_description", e.target.value)}
                placeholder="Décrivez votre projet, vos objectifs et vos besoins"
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="budget_range">Budget estimé</Label>
              <Input
                id="budget_range"
                value={formData.budget_range || ""}
                onChange={(e) => onChange("budget_range", e.target.value)}
                placeholder="Ex: 500 000 - 1 000 000 FCFA"
              />
            </div>
          </>
        );
      
      case "formation":
        return (
          <>
            <div>
              <Label htmlFor="formation_type">Type de formation *</Label>
              <Input
                id="formation_type"
                value={formData.formation_type || ""}
                onChange={(e) => onChange("formation_type", e.target.value)}
                placeholder="Ex: Gestion d'entreprise, Marketing digital, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="participants_count">Nombre de participants</Label>
              <Input
                id="participants_count"
                type="number"
                value={formData.participants_count || ""}
                onChange={(e) => onChange("participants_count", e.target.value)}
                placeholder="Nombre de personnes à former"
              />
            </div>
            <div>
              <Label htmlFor="formation_details">Détails de la formation *</Label>
              <Textarea
                id="formation_details"
                value={formData.formation_details || ""}
                onChange={(e) => onChange("formation_details", e.target.value)}
                placeholder="Objectifs, niveau des participants, durée souhaitée"
                rows={4}
                required
              />
            </div>
          </>
        );
      
      case "financement":
        return (
          <>
            <div>
              <Label htmlFor="funding_amount">Montant recherché *</Label>
              <Input
                id="funding_amount"
                value={formData.funding_amount || ""}
                onChange={(e) => onChange("funding_amount", e.target.value)}
                placeholder="Montant du financement souhaité"
                required
              />
            </div>
            <div>
              <Label htmlFor="project_sector">Secteur d'activité *</Label>
              <Input
                id="project_sector"
                value={formData.project_sector || ""}
                onChange={(e) => onChange("project_sector", e.target.value)}
                placeholder="Ex: Agriculture, Commerce, Services"
                required
              />
            </div>
            <div>
              <Label htmlFor="funding_purpose">Objet du financement *</Label>
              <Textarea
                id="funding_purpose"
                value={formData.funding_purpose || ""}
                onChange={(e) => onChange("funding_purpose", e.target.value)}
                placeholder="À quoi servira le financement? Décrivez votre projet"
                rows={4}
                required
              />
            </div>
          </>
        );
      
      case "digitale":
        return (
          <>
            <div>
              <Label htmlFor="solution_type">Type de solution *</Label>
              <Input
                id="solution_type"
                value={formData.solution_type || ""}
                onChange={(e) => onChange("solution_type", e.target.value)}
                placeholder="Ex: Site web, Application mobile, E-commerce"
                required
              />
            </div>
            <div>
              <Label htmlFor="features_required">Fonctionnalités souhaitées *</Label>
              <Textarea
                id="features_required"
                value={formData.features_required || ""}
                onChange={(e) => onChange("features_required", e.target.value)}
                placeholder="Listez les fonctionnalités que vous souhaitez"
                rows={4}
                required
              />
            </div>
            <div>
              <Label htmlFor="timeline">Délai souhaité</Label>
              <Input
                id="timeline"
                value={formData.timeline || ""}
                onChange={(e) => onChange("timeline", e.target.value)}
                placeholder="Ex: 2-3 mois"
              />
            </div>
          </>
        );
      
      case "identite":
        return (
          <>
            <div>
              <Label htmlFor="brand_name">Nom de la marque/entreprise *</Label>
              <Input
                id="brand_name"
                value={formData.brand_name || ""}
                onChange={(e) => onChange("brand_name", e.target.value)}
                placeholder="Nom de votre marque"
                required
              />
            </div>
            <div>
              <Label htmlFor="deliverables">Livrables souhaités *</Label>
              <Textarea
                id="deliverables"
                value={formData.deliverables || ""}
                onChange={(e) => onChange("deliverables", e.target.value)}
                placeholder="Ex: Logo, Charte graphique, Carte de visite, Flyers"
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="brand_values">Valeurs de la marque</Label>
              <Textarea
                id="brand_values"
                value={formData.brand_values || ""}
                onChange={(e) => onChange("brand_values", e.target.value)}
                placeholder="Décrivez l'identité et les valeurs que vous souhaitez transmettre"
                rows={3}
              />
            </div>
          </>
        );
      
      case "comptabilite":
        return (
          <>
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ""}
                onChange={(e) => onChange("company_name", e.target.value)}
                placeholder="Nom de votre entreprise"
                required
              />
            </div>
            <div>
              <Label htmlFor="services_needed">Services requis *</Label>
              <Textarea
                id="services_needed"
                value={formData.services_needed || ""}
                onChange={(e) => onChange("services_needed", e.target.value)}
                placeholder="Ex: Tenue de comptabilité, Déclarations fiscales, Conseil fiscal"
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_size">Taille de l'entreprise</Label>
              <Input
                id="company_size"
                value={formData.company_size || ""}
                onChange={(e) => onChange("company_size", e.target.value)}
                placeholder="Ex: TPE, PME, nombre d'employés"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {getServiceTitle()}
        </CardTitle>
        <CardDescription>
          Remplissez les informations pour votre demande de service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getServiceFields()}
      </CardContent>
    </Card>
  );
};

export default AdditionalServiceForm;
