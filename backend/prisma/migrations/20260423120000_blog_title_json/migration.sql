-- AlterTable
CREATE OR REPLACE FUNCTION public.parse_blog_title(blog_title TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    RETURN blog_title::jsonb;
  EXCEPTION
    WHEN others THEN
      RETURN jsonb_build_object('nl', blog_title, 'en', blog_title);
  END;
END;
$$;

ALTER TABLE "blog"
ALTER COLUMN "title" TYPE JSONB USING public.parse_blog_title("title");

DROP FUNCTION public.parse_blog_title(TEXT);
