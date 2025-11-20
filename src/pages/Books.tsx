import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";
import BorrowDialog from "@/components/BorrowDialog";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  quantity: number;
  available: number;
  cover_image_url: string | null;
}

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBooks(books);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = books.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn?.toLowerCase().includes(query) ||
          book.category?.toLowerCase().includes(query)
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, books]);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title");

      if (error) throw error;
      setBooks(data || []);
      setFilteredBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowClick = (book: Book) => {
    if (book.available <= 0) {
      toast.error("This book is currently unavailable");
      return;
    }
    setSelectedBook(book);
    setBorrowDialogOpen(true);
  };

  const handleBorrowSuccess = () => {
    fetchBooks();
    setBorrowDialogOpen(false);
    setSelectedBook(null);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Books Catalog</h1>
            <p className="text-muted-foreground text-lg">
              Browse and manage your library collection
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search books, authors, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No books found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add your first book to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl line-clamp-2">{book.title}</CardTitle>
                    {book.available > 0 ? (
                      <Badge variant="secondary" className="bg-success/20 text-success">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">{book.author}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {book.isbn && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ISBN:</span>
                        <span className="font-medium">{book.isbn}</span>
                      </div>
                    )}
                    {book.category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{book.category}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Copies:</span>
                      <span className="font-medium">
                        {book.available} of {book.quantity} available
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBorrowClick(book)}
                    disabled={book.available <= 0}
                    className="w-full"
                  >
                    Borrow Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedBook && (
        <BorrowDialog
          book={selectedBook}
          open={borrowDialogOpen}
          onOpenChange={setBorrowDialogOpen}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </Layout>
  );
};

export default Books;
