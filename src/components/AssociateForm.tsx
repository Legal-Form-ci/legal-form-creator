import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Associate {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  birthDate: string;
  birthPlace: string;
  maritalStatus: string;
  maritalRegime: string;
  childrenCount: number;
  residenceAddress: string;
  isManager: boolean;
  cashContribution: number;
  natureContributionDescription: string;
  natureContributionValue: number;
  idDocument: File | null;
  birthCertificate: File | null;
  criminalRecord: File | null;
}

interface AssociateFormProps {
  associate: Associate;
  index: number;
  calculated: any;
  totalContribution: number;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof Associate, value: any) => void;
  onRemove: (id: string) => void;
  onFileChange: (id: string, field: 'idDocument' | 'birthCertificate' | 'criminalRecord', file: File | null) => void;
}

const AssociateForm = ({
  associate,
  index,
  calculated,
  totalContribution,
  canRemove,
  onUpdate,
  onRemove,
  onFileChange
}: AssociateFormProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Associé {index + 1} {associate.isManager && <span className="text-sm text-primary">(Gérant)</span>}
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemove(associate.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations personnelles */}
        <div>
          <h4 className="font-semibold mb-3 text-primary">Informations personnelles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom complet *</Label>
              <Input
                value={associate.fullName}
                onChange={(e) => onUpdate(associate.id, 'fullName', e.target.value)}
                placeholder="Nom et prénoms"
                required
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={associate.phone}
                onChange={(e) => onUpdate(associate.id, 'phone', e.target.value)}
                placeholder="+225 0101010101"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={associate.email}
                onChange={(e) => onUpdate(associate.id, 'email', e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label>N° Pièce d'identité</Label>
              <Input
                value={associate.idNumber}
                onChange={(e) => onUpdate(associate.id, 'idNumber', e.target.value)}
                placeholder="CNI, Passeport..."
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={associate.birthDate}
                onChange={(e) => onUpdate(associate.id, 'birthDate', e.target.value)}
              />
            </div>
            <div>
              <Label>Lieu de naissance</Label>
              <Input
                value={associate.birthPlace}
                onChange={(e) => onUpdate(associate.id, 'birthPlace', e.target.value)}
                placeholder="Ville, Pays"
              />
            </div>
            <div>
              <Label>Situation matrimoniale</Label>
              <Select
                value={associate.maritalStatus}
                onValueChange={(value) => onUpdate(associate.id, 'maritalStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celibataire">Célibataire</SelectItem>
                  <SelectItem value="marie">Marié(e)</SelectItem>
                  <SelectItem value="divorce">Divorcé(e)</SelectItem>
                  <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Régime matrimonial</Label>
              <Select
                value={associate.maritalRegime}
                onValueChange={(value) => onUpdate(associate.id, 'maritalRegime', value)}
                disabled={associate.maritalStatus !== 'marie'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communaute">Communauté de biens</SelectItem>
                  <SelectItem value="separation">Séparation de biens</SelectItem>
                  <SelectItem value="participation">Participation aux acquêts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre d'enfants</Label>
              <Input
                type="number"
                min="0"
                value={associate.childrenCount}
                onChange={(e) => onUpdate(associate.id, 'childrenCount', parseInt(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    onUpdate(associate.id, 'childrenCount', 0);
                  }
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Adresse de résidence</Label>
              <Textarea
                value={associate.residenceAddress}
                onChange={(e) => onUpdate(associate.id, 'residenceAddress', e.target.value)}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Est gérant ? */}
        <div className="flex items-center space-x-2 border-t pt-4">
          <Checkbox
            id={`manager-${associate.id}`}
            checked={associate.isManager}
            onCheckedChange={(checked) => onUpdate(associate.id, 'isManager', checked)}
          />
          <Label htmlFor={`manager-${associate.id}`} className="font-semibold cursor-pointer">
            Cet associé est le gérant de l'entreprise
          </Label>
        </div>

        {/* Documents */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 text-primary">Documents à fournir</h4>
          <div className="space-y-3">
            <div>
              <Label>Carte Nationale d'Identité (CNI) *</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onFileChange(associate.id, 'idDocument', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {associate.idDocument && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fichier: {associate.idDocument.name}
                </p>
              )}
            </div>
            <div>
              <Label>Extrait de naissance *</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onFileChange(associate.id, 'birthCertificate', e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {associate.birthCertificate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fichier: {associate.birthCertificate.name}
                </p>
              )}
            </div>
            {associate.isManager && (
              <div>
                <Label>Casier judiciaire (optionnel pour gérant)</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => onFileChange(associate.id, 'criminalRecord', e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {associate.criminalRecord && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fichier: {associate.criminalRecord.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Apports */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 text-primary">Apports</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Apport en numéraire (FCFA) *</Label>
              <Input
                type="number"
                value={associate.cashContribution}
                onChange={(e) => onUpdate(associate.id, 'cashContribution', parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    onUpdate(associate.id, 'cashContribution', 0);
                  }
                }}
                placeholder="Montant en FCFA"
                min="0"
              />
            </div>
            <div>
              <Label>Apport en nature (FCFA)</Label>
              <Input
                type="number"
                value={associate.natureContributionValue}
                onChange={(e) => onUpdate(associate.id, 'natureContributionValue', parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    onUpdate(associate.id, 'natureContributionValue', 0);
                  }
                }}
                placeholder="Montant en FCFA"
                min="0"
              />
            </div>
          </div>
          
          {associate.natureContributionValue > 0 && (
            <div className="mt-3">
              <Label>Description de l'apport en nature</Label>
              <Textarea
                value={associate.natureContributionDescription}
                onChange={(e) => onUpdate(associate.id, 'natureContributionDescription', e.target.value)}
                placeholder="Décrivez les biens apportés (matériel, véhicule, etc.)"
                rows={2}
              />
            </div>
          )}
          
          {/* Calcul automatique */}
          {calculated && (
            <div className="mt-4 bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Calcul automatique (lecture seule)</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Apport total:</span>
                  <p className="font-semibold">{totalContribution.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pourcentage:</span>
                  <p className="font-semibold">{calculated.percentage || 0}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nombre de parts:</span>
                  <p className="font-semibold">{calculated.numberOfShares || 0} parts</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Parts n°:</span>
                  <p className="font-semibold">
                    {calculated.shareStart || 0} à {calculated.shareEnd || 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Base: 5 000 FCFA par part sociale (selon OHADA)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssociateForm;