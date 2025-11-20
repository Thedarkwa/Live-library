import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BookMarked, Clock, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";

interface Stats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total books count
      const { count: totalBooks } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      // Available books (sum of available column)
      const { data: booksData } = await supabase
        .from("books")
        .select("available");
      
      const availableBooks = booksData?.reduce((sum, book) => sum + (book.available || 0), 0) || 0;

      // Borrowed books (active transactions)
      const { count: borrowedBooks } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .is("returned_at", null);

      // Overdue books
      const { count: overdueBooks } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .is("returned_at", null)
        .lt("due_date", new Date().toISOString());

      setStats({
        totalBooks: totalBooks || 0,
        availableBooks,
        borrowedBooks: borrowedBooks || 0,
        overdueBooks: overdueBooks || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      description: "Books in inventory",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Available",
      value: stats.availableBooks,
      description: "Ready to borrow",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Borrowed",
      value: stats.borrowedBooks,
      description: "Currently on loan",
      icon: BookMarked,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Overdue",
      value: stats.overdueBooks,
      description: "Past due date",
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to your library management system
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <CardDescription className="mt-1">
                    {stat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
