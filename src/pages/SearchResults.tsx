import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, ExternalLink, Download, ArrowLeft, FileText, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

interface SearchResult {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

const RESULTS_PER_PAGE = 5;

const SearchResults = () => {
  const { t } = useTranslation();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const stored = sessionStorage.getItem("searchResults");
    const storedQuery = sessionStorage.getItem("searchQuery");
    if (stored) setResults(JSON.parse(stored));
    if (storedQuery) setQuery(storedQuery);
  }, []);

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const paginatedResults = results.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 124, 122);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Legal Form", 15, 18);
    doc.setFontSize(10);
    doc.text("Résultats de recherche", 15, 27);
    doc.text(`Recherche : "${query}"`, 100, 27);

    doc.setTextColor(0, 0, 0);
    let y = 45;

    doc.setFontSize(14);
    doc.text(`${results.length} résultat(s) trouvé(s)`, 15, y);
    y += 12;

    results.forEach((result, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 124, 122);
      const title = result.title || `Résultat ${i + 1}`;
      doc.text(title.slice(0, 80), 15, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      if (result.url) {
        doc.text(result.url.slice(0, 90), 15, y);
        y += 5;
      }

      doc.setTextColor(50, 50, 50);
      const desc = result.description || result.markdown?.slice(0, 200) || "";
      const lines = doc.splitTextToSize(desc, 180);
      doc.text(lines.slice(0, 3), 15, y);
      y += lines.slice(0, 3).length * 4.5 + 8;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Legal Form SARL | www.legalform.ci | contact@legalform.ci | +225 07 59 56 60 87`, 15, 287);
      doc.text(`Page ${i}/${pageCount}`, 180, 287);
    }

    doc.save(`LegalForm-Recherche-${query.slice(0, 30)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground">
                <Search className="inline h-6 w-6 text-primary mr-2" />
                Résultats pour "{query}"
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {results.length} résultat(s) • Sources vérifiées • Zone OHADA prioritaire
              </p>
            </div>
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>

          {paginatedResults.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun résultat. Retournez à l'accueil pour lancer une recherche.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedResults.map((result, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
                        {result.title || `Résultat ${(page - 1) * RESULTS_PER_PAGE + i + 1}`}
                      </CardTitle>
                      <Badge variant="secondary" className="flex-shrink-0">
                        <Globe className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    </div>
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {result.url.length > 60 ? result.url.slice(0, 60) + "..." : result.url}
                      </a>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.description || result.markdown?.slice(0, 300) || "Contenu disponible à la source."}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;
