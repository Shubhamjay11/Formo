ALTER TABLE "users" ADD COLUMN "active_org_id" uuid;--> statement-breakpoint
CREATE INDEX "users_active_org_id_idx" ON "users" USING btree ("active_org_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_active_org_id_organizations_id_fk" FOREIGN KEY ("active_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;