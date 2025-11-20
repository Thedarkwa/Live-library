-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  available INTEGER NOT NULL DEFAULT 1,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT,
  borrower_phone TEXT,
  borrowed_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for books (public read, authenticated write)
CREATE POLICY "Anyone can view books"
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert books"
  ON public.books FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON public.books FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete books"
  ON public.books FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for transactions (public read, authenticated write)
CREATE POLICY "Anyone can view transactions"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_books_title ON public.books(title);
CREATE INDEX idx_books_author ON public.books(author);
CREATE INDEX idx_books_isbn ON public.books(isbn);
CREATE INDEX idx_transactions_book_id ON public.transactions(book_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_due_date ON public.transactions(due_date);

-- Create function to update book availability
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a book is borrowed, decrease available count
    UPDATE public.books 
    SET available = available - 1 
    WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.returned_at IS NOT NULL AND OLD.returned_at IS NULL THEN
    -- When a book is returned, increase available count
    UPDATE public.books 
    SET available = available + 1 
    WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update book availability
CREATE TRIGGER trigger_update_book_availability
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_book_availability();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for books updated_at
CREATE TRIGGER set_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();