import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const borrowSchema = z.object({
  borrowerName: z.string().min(1, "Borrower name is required").max(100),
  borrowerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  borrowerPhone: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

interface BorrowDialogProps {
  book: {
    id: string;
    title: string;
    author: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BorrowDialog = ({ book, open, onOpenChange, onSuccess }: BorrowDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerEmail: "",
    borrowerPhone: "",
    dueDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = borrowSchema.parse(formData);

      const { error } = await supabase.from("transactions").insert([
        {
          book_id: book.id,
          borrower_name: validatedData.borrowerName,
          borrower_email: validatedData.borrowerEmail || null,
          borrower_phone: validatedData.borrowerPhone || null,
          due_date: validatedData.dueDate,
          status: "borrowed",
        },
      ]);

      if (error) throw error;

      toast.success("Book borrowed successfully!");
      setFormData({
        borrowerName: "",
        borrowerEmail: "",
        borrowerPhone: "",
        dueDate: "",
      });
      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error borrowing book:", error);
        toast.error("Failed to process borrowing");
      }
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Borrow Book</DialogTitle>
          <DialogDescription>
            "{book.title}" by {book.author}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrowerName">
              Borrower Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="borrowerName"
              name="borrowerName"
              value={formData.borrowerName}
              onChange={handleChange}
              placeholder="Enter borrower's name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrowerEmail">Email</Label>
            <Input
              id="borrowerEmail"
              name="borrowerEmail"
              type="email"
              value={formData.borrowerEmail}
              onChange={handleChange}
              placeholder="borrower@example.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrowerPhone">Phone</Label>
            <Input
              id="borrowerPhone"
              name="borrowerPhone"
              type="tel"
              value={formData.borrowerPhone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              min={minDate}
              value={formData.dueDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Confirm Borrow"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowDialog;
