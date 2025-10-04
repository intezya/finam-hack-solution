import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { NewsDTO } from "@/types/news";
import { 
  formatRelativeDate, 
  getSentimentColor, 
  getHotnessColor, 
  getImpactColor, 
  getHotnessLabel,
  copyToClipboard,
  formatDraftForCopy 
} from "@/lib/newsUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Flame, 
  TrendingUp, 
  Building2, 
  Clock, 
  DollarSign, 
  ExternalLink,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  Newspaper,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface OtherSource {
  url: string;
  title: string;
  content: string;
  score: number;
}

const NewsDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const news = location.state?.news as NewsDTO | undefined;
  const [otherSources, setOtherSources] = useState<OtherSource[]>([]);
  const [isLoadingOtherSources, setIsLoadingOtherSources] = useState(false);
  const [showOtherSources, setShowOtherSources] = useState(false);

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Новость не найдена</h2>
          <p className="text-muted-foreground mb-6">Данные новости не переданы</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyDraft = async () => {
    const success = await copyToClipboard(formatDraftForCopy(news));
    if (success) {
      toast.success("Черновик скопирован в буфер обмена");
    } else {
      toast.error("Не удалось скопировать");
    }
  };

  const handleCopyHeadline = async () => {
    const success = await copyToClipboard(news.headline);
    if (success) {
      toast.success("Заголовок скопирован");
    } else {
      toast.error("Не удалось скопировать");
    }
  };

  const handleExportMarkdown = () => {
    const markdown = `# ${news.headline}

${news.lead}

${news.bullets.map(bullet => `- ${bullet}`).join('\n')}

## Заключение

${news.conclusion}

---

**Источник:** [${news.title}](${news.link})  
**Дата:** ${new Date(news.published_at).toLocaleString('ru-RU')}  
**Sentiment:** ${news.sentiment}  
**Impact:** ${news.impact_level}  
**Hotness:** ${Math.round(news.hotness_score * 100)}%
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-${news.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Markdown файл загружен");
  };

  const fetchOtherSources = async () => {
    setIsLoadingOtherSources(true);
    setShowOtherSources(true);
    
    try {
      const response = await fetch('https://n8n.intezya.ru/webhook/get-other', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: news.title,
          now_site: news.link
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch other sources');
      }

      const data = await response.json();
      const sources = data.results?.[0] || [];
      setOtherSources(sources);
    } catch (error) {
      console.error('Error fetching other sources:', error);
      toast.error('Не удалось загрузить другие источники');
      setOtherSources([]);
    } finally {
      setIsLoadingOtherSources(false);
    }
  };

  const hotnessColor = getHotnessColor(news.hotness_score);
  const sentimentVariant = getSentimentColor(news.sentiment);
  const impactVariant = getImpactColor(news.impact_level);
  const isHighHotness = news.hotness_score >= 0.8;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Newspaper className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Детали новости</h1>
              <p className="text-sm text-muted-foreground">
                Полная информация и черновик
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Аналитическая секция */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={isHighHotness ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Метрики влияния
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Hotness Score */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Flame className={`h-4 w-4 ${hotnessColor} ${isHighHotness ? "animate-pulse" : ""}`} />
                      <span className="text-sm font-medium">Важность:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={hotnessColor + " text-xs"}>
                        {Math.round(news.hotness_score * 100)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getHotnessLabel(news.hotness_score)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Sentiment */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Тональность:</span>
                    <Badge variant={sentimentVariant as any} className="text-xs">
                      {news.sentiment}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Impact Level */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Уровень влияния:</span>
                    <Badge variant={impactVariant as any} className="text-xs">
                      {news.impact_level}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Published Date */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Дата публикации:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeDate(news.published_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entities */}
            {(news.companies.length > 0 ||
              news.sectors.length > 0 ||
              news.people.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Entities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {news.companies.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Компании</div>
                      <div className="flex flex-wrap gap-2">
                        {news.companies.map((company, i) => (
                          <Badge key={i} variant="secondary">
                            {company}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {news.sectors.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Секторы</div>
                      <div className="flex flex-wrap gap-2">
                        {news.sectors.map((sector, i) => (
                          <Badge key={i} variant="outline">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {news.people.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Люди</div>
                      <div className="flex flex-wrap gap-2">
                        {news.people.map((person, i) => (
                          <Badge key={i} variant="outline">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Why Now */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Clock className="h-5 w-5" />
                  Почему сейчас?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900/80 dark:text-blue-100/80">
                  {news.why_now}
                </p>
              </CardContent>
            </Card>

            {/* Affected Assets */}
            {news.affected_assets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Влияние на активы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {news.affected_assets.map((asset, i) => (
                      <Badge key={i} variant="default" className="text-sm">
                        {asset}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Источник
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{news.title}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(news.link, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть источник
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={fetchOtherSources}
                  disabled={isLoadingOtherSources}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Посмотреть другие источники
                </Button>
              </CardContent>
            </Card>

            {/* Other Sources */}
            {showOtherSources && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Другие источники
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingOtherSources ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : otherSources.length > 0 ? (
                    <div className="space-y-4">
                      {otherSources.map((source, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b last:border-b-0">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline flex items-start gap-2"
                          >
                            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {source.title}
                          </a>
                          {source.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {source.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Другие источники не найдены
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Черновик для публикации */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="border-b bg-muted/50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6" />
                  Готовый черновик для публикации
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-4 text-foreground">
                    {news.headline}
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {news.lead}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  {news.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-foreground">{bullet}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-foreground leading-relaxed italic">
                    {news.conclusion}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button onClick={handleCopyDraft} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Скопировать черновик
                  </Button>
                  <Button onClick={handleCopyHeadline} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Скопировать заголовок
                  </Button>
                  <Button onClick={handleExportMarkdown} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт в Markdown
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
