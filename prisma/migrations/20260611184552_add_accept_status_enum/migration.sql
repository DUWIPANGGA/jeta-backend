-- Create enum type for AcceptStatus
CREATE TYPE "AcceptStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- Drop existing default on accept_status column
ALTER TABLE "custom_orders" ALTER COLUMN "accept_status" DROP DEFAULT;

-- Migrate existing boolean data to enum
ALTER TABLE "custom_orders" 
  ALTER COLUMN "accept_status" TYPE "AcceptStatus" 
  USING CASE 
    WHEN "accept_status" = true THEN 'accepted'::"AcceptStatus"
    ELSE 'pending'::"AcceptStatus"
  END;

-- Set new default
ALTER TABLE "custom_orders" 
  ALTER COLUMN "accept_status" SET DEFAULT 'pending';
