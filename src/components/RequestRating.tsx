import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface RequestRatingProps {
  requestId: string;
  requestType: "company" | "service";
  existingRating?: number | null;
  existingReview?: string | null;
  onRatingSubmitted?: () => void;
}

const RequestRating = ({
  requestId,
  requestType,
  existingRating,
  existingReview,
  onRatingSubmitted,
}: RequestRatingProps) => {
  const [rating, setRating] = useState(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez donner une note avant de soumettre",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tableName = requestType === 'company' ? 'company_requests' : 'service_requests';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          client_rating: rating,
          client_review: review || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Merci pour votre avis !",
        description: "Votre évaluation a été enregistrée",
      });

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre avis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évaluation du service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Comment évaluez-vous notre service ?
          </p>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Partagez votre expérience avec nous (optionnel)..."
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full"
        >
          {isSubmitting ? "Envoi..." : "Soumettre mon avis"}
        </Button>

        {existingRating && (
          <p className="text-xs text-muted-foreground text-center">
            Vous avez déjà évalué ce service avec {existingRating} étoile{existingRating > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestRating;
