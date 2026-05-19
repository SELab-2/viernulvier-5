-- Create trigger function to auto-update blog.updated_at
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on blog table
DROP TRIGGER IF EXISTS blog_update_trigger ON blog;
CREATE TRIGGER blog_update_trigger
BEFORE UPDATE ON blog
FOR EACH ROW
EXECUTE FUNCTION update_blog_updated_at();
