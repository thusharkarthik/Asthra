"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentComposer({ onSubmit, isSubmitting }: { onSubmit: (content: string) => void; isSubmitting?: boolean }) {
  const [content, setContent] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = content.trim();
    if (!value) return;
    onSubmit(value);
    setContent("");
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input placeholder="Add a comment" value={content} onChange={(event) => setContent(event.target.value)} />
      <Button disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add"}</Button>
    </form>
  );
}
