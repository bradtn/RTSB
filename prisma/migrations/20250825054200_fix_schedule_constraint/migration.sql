-- Add the new unique constraint that includes operationId
-- First, remove any duplicate schedules that would violate the new constraint
DELETE FROM "Schedule" a USING "Schedule" b 
WHERE a.id > b.id 
AND a."bidPeriodId" = b."bidPeriodId" 
AND a."operationId" = b."operationId" 
AND a."lineNumber" = b."lineNumber";

-- Drop the old constraint (if it exists) and add new one
DO $$
BEGIN
    -- Try to drop the old constraint
    BEGIN
        ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_bidPeriodId_lineNumber_key";
    EXCEPTION WHEN undefined_object THEN
        -- Constraint doesn't exist, continue
    END;
    
    -- Add the new constraint
    ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_bidPeriodId_operationId_lineNumber_key" UNIQUE ("bidPeriodId", "operationId", "lineNumber");
END $$;