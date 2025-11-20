-- Fix search path for update_book_availability function
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search path for update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;