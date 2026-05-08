import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

interface Section {
  heading: string;
  body: string;
}

const Terms = () => {
  const [title, setTitle] = useState("Conditions Générales d'Utilisation");
  const [sections, setSections] = useState<Section[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page_key', 'terms')
        .maybeSingle();

      if (data) {
        setTitle(data.title);
        setSections(Array.isArray(data.content) ? (data.content as unknown as Section[]) : []);
        setUpdatedAt(new Date(data.updated_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mb-4">
              {title}
            </h1>
            {updatedAt && (
              <p className="text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
            )}
          </div>

          <Card>
            <CardContent className="p-8 prose prose-slate max-w-none">
              {sections.map((section, i) => (
                <div key={i} className="mb-6">
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">{section.heading}</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{section.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;