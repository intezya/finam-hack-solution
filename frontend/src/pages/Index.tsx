import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NewsDTO } from "@/types/news";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Search } from "lucide-react";
import { formatRelativeDate } from "@/lib/newsUtils";
import { useToast } from "@/hooks/use-toast";

type TimeFilter = "24h" | "3d" | "7d" | "30d" | "all";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [newsData, setNewsData] = useState<NewsDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка новостей с API
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let dateFrom: Date;
        
        switch (timeFilter) {
          case "24h":
            dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "3d":
            dateFrom = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            break;
          case "7d":
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0); // all time
        }

        const response = await fetch(
          `https://n8n.intezya.ru/webhook/getbydate?date=${dateFrom.toISOString()}`
        );
        
        if (!response.ok) throw new Error("Ошибка загрузки новостей");
        
        const data: NewsDTO[] = await response.json();
        setNewsData(data);
      } catch (error) {
        console.error("Error fetching news:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить новости. Попробуйте позже.",
          variant: "destructive",
        });
        setNewsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [timeFilter, toast]);

  // Фильтрация по поиску
  const filteredNews = newsData.filter((news) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = news.title.toLowerCase().includes(query) || 
                        news.headline.toLowerCase().includes(query);
      const companiesMatch = news.companies.some(c => c.toLowerCase().includes(query));
      const sectorsMatch = news.sectors.some(s => s.toLowerCase().includes(query));
      
      if (!titleMatch && !companiesMatch && !sectorsMatch) {
        return false;
      }
    }
    return true;
  });

  // Сортировка по дате (новые сверху)
  const sortedNews = [...filteredNews].sort((a, b) => {
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Финансовые новости</h1>
              <p className="text-sm text-muted-foreground">
                Горячие события рынка в реальном времени
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Поиск и фильтр */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по заголовкам, компаниям, секторам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-14 pr-4 text-lg border-2 focus-visible:ring-2"
            />
          </div>
          <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[200px] h-14 text-base">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Последние 24 часа</SelectItem>
              <SelectItem value="3d">Последние 3 дня</SelectItem>
              <SelectItem value="7d">Последняя неделя</SelectItem>
              <SelectItem value="30d">Последний месяц</SelectItem>
              <SelectItem value="all">Все время</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблица новостей */}
        {loading ? (
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Важность</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead className="w-[180px]">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-full max-w-xl" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : sortedNews.length > 0 ? (
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Важность</TableHead>
                  <TableHead>Заголовок</TableHead>
                  <TableHead className="w-[180px]">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedNews.map((news) => {
                  const isHighHotness = news.hotness_score >= 0.8;
                  return (
                    <TableRow 
                      key={news.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        isHighHotness ? "bg-destructive/5" : ""
                      }`}
                      onClick={() => navigate(`/news/${news.id}`, { state: { news } })}
                    >
                      <TableCell>
                        <span className={`font-bold text-lg ${
                          isHighHotness ? "text-destructive" : "text-muted-foreground"
                        }`}>
                          {Math.round(news.hotness_score * 100)}%
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className={`line-clamp-2 ${
                          isHighHotness ? "text-destructive font-semibold" : ""
                        }`}>
                          {news.headline}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeDate(news.published_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Новостей не найдено</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить период или поисковый запрос
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
