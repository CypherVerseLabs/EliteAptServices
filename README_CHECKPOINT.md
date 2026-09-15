Elite Apartment Services
Current Build Status
Checkpoint: Pricing System Database Complete
Date: September 14, 2026

The Elite Apartment Services web application is being built as a digital replacement for the company's paper-based apartment make-ready workflow.

Technology
Next.js 16
React 19
TypeScript
Tailwind CSS
Supabase
PostgreSQL
Supabase SSR
Lucide React
Completed
Application
Dashboard
Customers
Properties
Workers
Contractors
Jobs
Work Orders
Paperwork
Payroll
Reports
Settings
Pricing
Pricing System
The pricing database has been created and deployed to Supabase.

Migration:

supabase/migrations/20260914190643_create_pricing_system.sql

Database tables:

price_lists
pricing_categories
pricing_items
The pricing system supports:

Multiple price lists
Pricing categories
Company abbreviations
Flat pricing
Per-square-foot pricing
Per-wall pricing
Per-room pricing
Per-unit pricing
Per-item pricing
Per-area pricing
Estimate-based pricing
Minimum quantities
Maximum quantities
Active/inactive pricing
Historical/effective pricing dates
Seeded Pricing
The database currently includes pricing for:

Basic Make Ready
Make Ready Add-ons
Painter Pricing
Painting
Painting Abbreviations
Cabinets
Sheetrock
Tape / Float / Texture
Miscellaneous services
Additional service categories have also been established for:

Carpet Cleaning
Housekeeping
Resurfacing
Ceramic Tile
Pricing Routes
/dashboard/pricing

/dashboard/pricing/[priceListId]

/dashboard/pricing/new

/dashboard/pricing/[priceListId]/edit/[itemId]

Database Deployment
Supabase CLI is linked to the correct project.

Project reference:

ywybqtryqreibxjaqtkj

The pricing migration has been successfully pushed to the remote database.

Command used:

npx supabase db push

Result:

Finished supabase db push.

Production Build
The application currently passes:

npm run build

TypeScript compilation and Next.js production generation are successful.

Next Development Phase
The next major phase is connecting the pricing system to the operational workflow.

Target workflow:

Property
Unit
Work Order
Technician
Work Performed
Pricing Selection
Automatic Price Calculation
Completion Documentation
Property Sign-Off
Weekly Technician Payment
Reporting
The pricing system should become the central source of truth for calculating work-order and technician pricing.

Important Rule
Elite Apartment Services uses internal abbreviations for services. These abbreviations must be preserved and used consistently throughout the application.

Examples include:

FPW
FPW-CC
PC
T-up
SRR-W
SRR-C
TFT-W
TFT-C
KCWW
KCBW
BCWW
BCBW
Do not remove or replace these abbreviations when expanding the system.

Current Checkpoint
DATABASE: COMPLETE
PRICING SYSTEM: DEPLOYED
PRODUCTION BUILD: PASSING
SUPABASE LINK: CONFIRMED
NEXT PHASE: Connect pricing to Work Orders and Work Performed

Before making major architectural changes, create another checkpoint in this README.