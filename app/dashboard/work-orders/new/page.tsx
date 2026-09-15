"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Building2,
  Home,
  CalendarDays,
  User,
  Phone,
  DollarSign,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PricingType =
  | "flat"
  | "per_sq_ft"
  | "per_wall"
  | "per_room"
  | "per_unit"
  | "per_item"
  | "per_area"
  | "per_estimate";

type ServicePricing = {
  id: string;
  apartment_company_id: string;
  service_category: string;
  pricing_type: PricingType;
  price: number;
  active: boolean;
};

const bedroomTypes = [
  "Studio",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4 Bedrooms",
  "5+ Bedrooms",
];

const bathroomTypes = [
  "1 Bathroom",
  "1.5 Bathrooms",
  "2 Bathrooms",
  "2.5 Bathrooms",
  "3 Bathrooms",
  "3.5+ Bathrooms",
];

const PROPERTY_ID =
  "84416fd3-b33f-4297-91a8-d973ab69e9d5";

const APARTMENT_COMPANY_ID =
  "1e879c9a-2220-434c-91ce-eb4c28a5a477";

const pricingTypeLabels: Record<PricingType, string> = {
  flat: "Flat Rate",
  per_sq_ft: "Per Square Foot",
  per_wall: "Per Wall",
  per_room: "Per Room",
  per_unit: "Per Unit",
  per_item: "Per Item",
  per_area: "Per Area",
  per_estimate: "Per Estimate",
};

function formatServiceName(value: string) {
  return value
    .split("_")
    .map((word) => {
      if (/^\d/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getDefaultQuantity(
  pricingType: PricingType,
  squareFeet: number
) {
  if (pricingType === "per_sq_ft") {
    return squareFeet > 0 ? squareFeet : 0;
  }

  return 1;
}

function getPricingUnitLabel(
  pricingType: PricingType
) {
  switch (pricingType) {
    case "flat":
      return "flat rate";

    case "per_sq_ft":
      return "sq ft";

    case "per_wall":
      return "wall";

    case "per_room":
      return "room";

    case "per_unit":
      return "unit";

    case "per_item":
      return "item";

    case "per_area":
      return "area";

    case "per_estimate":
      return "estimate";

    default:
      return "";
  }
}

const supabase = createClient();

export default function NewWorkOrderPage() {
  

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadingPricing, setLoadingPricing] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [pricing, setPricing] = useState<
    ServicePricing[]
  >([]);

  const [selectedPricingId, setSelectedPricingId] =
    useState("");

  const [squareFeet, setSquareFeet] =
    useState("");

  const [pricingQuantity, setPricingQuantity] =
    useState("1");

  /*
   * ---------------------------------------------------------
   * LOAD SERVICE PRICING
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadPricing() {
      setLoadingPricing(true);

      const {
        data,
        error,
      } = await supabase
        .from("service_pricing")
        .select(
          `
            id,
            apartment_company_id,
            service_category,
            pricing_type,
            price,
            active
          `
        )
        .eq(
          "apartment_company_id",
          APARTMENT_COMPANY_ID
        )
        .eq("active", true)
        .order("service_category", {
          ascending: true,
        });

      if (error) {
        console.error(
          "SERVICE PRICING LOAD ERROR:",
          {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );

        setErrorMessage(
          error.message ||
            "Unable to load service pricing."
        );

        setLoadingPricing(false);
        return;
      }

      const rows: ServicePricing[] =
        (data || []).map((row) => ({
          id: row.id,
          apartment_company_id:
            row.apartment_company_id,
          service_category:
            row.service_category,
          pricing_type:
            row.pricing_type as PricingType,
          price: Number(row.price),
          active: Boolean(row.active),
        }));

      setPricing(rows);

      setLoadingPricing(false);
    }

    loadPricing();
  }, [supabase]);

  /*
   * ---------------------------------------------------------
   * SELECTED PRICING
   * ---------------------------------------------------------
   */

  const selectedPricing = useMemo(() => {
    return pricing.find(
      (item) =>
        item.id === selectedPricingId
    );
  }, [pricing, selectedPricingId]);

  /*
   * ---------------------------------------------------------
   * AUTOMATIC QUANTITY
   *
   * per_sq_ft uses square feet.
   * Everything else defaults to 1.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedPricing) {
      setPricingQuantity("1");
      return;
    }

    const quantity = getDefaultQuantity(
      selectedPricing.pricing_type,
      Number(squareFeet)
    );

    setPricingQuantity(
      String(quantity)
    );
  }, [
    selectedPricing,
    squareFeet,
  ]);

  /*
   * ---------------------------------------------------------
   * CALCULATED TOTAL
   * ---------------------------------------------------------
   */

  const calculatedTotal = useMemo(() => {
    if (!selectedPricing) {
      return 0;
    }

    const quantity =
      Number(pricingQuantity) || 0;

    const unitPrice =
      Number(selectedPricing.price) || 0;

    return unitPrice * quantity;
  }, [
    selectedPricing,
    pricingQuantity,
  ]);

  /*
   * ---------------------------------------------------------
   * SERVICE CHANGE
   * ---------------------------------------------------------
   */

  function handleServiceChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const pricingId =
      event.target.value;

    setSelectedPricingId(
      pricingId
    );

    const selected = pricing.find(
      (item) =>
        item.id === pricingId
    );

    if (!selected) {
      setPricingQuantity("1");
      return;
    }

    const quantity =
      getDefaultQuantity(
        selected.pricing_type,
        Number(squareFeet)
      );

    setPricingQuantity(
      String(quantity)
    );
  }

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitted(false);
    setErrorMessage("");

    try {
      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      /*
       * -------------------------------------------------------
       * 1. VERIFY AUTHENTICATED USER
       * -------------------------------------------------------
       */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "SUPABASE AUTH ERROR:",
          {
            message:
              authError.message,
            status:
              authError.status,
            name:
              authError.name,
          }
        );

        throw new Error(
          authError.message ||
            "Unable to verify your login session."
        );
      }

      if (!user) {
        throw new Error(
          "You must be logged in to create a work order."
        );
      }

      /*
       * -------------------------------------------------------
       * 2. READ FORM VALUES
       * -------------------------------------------------------
       */

      const propertyName =
        String(
          formData.get(
            "property_name"
          ) || ""
        ).trim();

      const propertyAddress =
        String(
          formData.get(
            "property_address"
          ) || ""
        ).trim();

      const city =
        String(
          formData.get("city") ||
            ""
        ).trim();

      const state =
        String(
          formData.get("state") ||
            "TX"
        ).trim();

      const zip =
        String(
          formData.get("zip") ||
            ""
        ).trim();

      const serviceArea =
        String(
          formData.get(
            "service_area"
          ) || ""
        ).trim();

      const unitNumber =
        String(
          formData.get(
            "unit_number"
          ) || ""
        ).trim();

      const squareFeetValue =
        String(
          formData.get(
            "square_feet"
          ) || ""
        ).trim();

      const squareFeetNumber =
        Number(squareFeetValue);

      const bedrooms =
        String(
          formData.get(
            "bedrooms"
          ) || ""
        ).trim();

      const bathrooms =
        String(
          formData.get(
            "bathrooms"
          ) || ""
        ).trim();

      const occupancy =
        String(
          formData.get(
            "occupancy"
          ) || "vacant"
        ).trim();

      const serviceCategory =
        String(
          formData.get(
            "service_category"
          ) || ""
        ).trim();

      const serviceLabel =
        String(
          formData.get(
            "service_label"
          ) || ""
        ).trim();

      const description =
        String(
          formData.get(
            "description"
          ) || ""
        ).trim();

      const priority =
        String(
          formData.get(
            "priority"
          ) || "normal"
        ).trim();

      const contactName =
        String(
          formData.get(
            "contact_name"
          ) || ""
        ).trim();

      const contactPhone =
        String(
          formData.get(
            "contact_phone"
          ) || ""
        ).trim();

      const requestedDate =
        String(
          formData.get(
            "requested_date"
          ) || ""
        ).trim();

      const accessMethod =
        String(
          formData.get(
            "access_method"
          ) || "office"
        ).trim();

      const accessNotes =
        String(
          formData.get(
            "access_notes"
          ) || ""
        ).trim();

      /*
       * -------------------------------------------------------
       * 3. VALIDATION
       * -------------------------------------------------------
       */

      if (!propertyName) {
        throw new Error(
          "Property name is required."
        );
      }

      if (!propertyAddress) {
        throw new Error(
          "Property address is required."
        );
      }

      if (!city) {
        throw new Error(
          "City is required."
        );
      }

      if (!state) {
        throw new Error(
          "State is required."
        );
      }

      if (!zip) {
        throw new Error(
          "ZIP code is required."
        );
      }

      if (!serviceArea) {
        throw new Error(
          "Service area is required."
        );
      }

      if (!unitNumber) {
        throw new Error(
          "Unit number is required."
        );
      }

      if (
        !squareFeetNumber ||
        squareFeetNumber < 1
      ) {
        throw new Error(
          "Square feet must be greater than 0."
        );
      }

      if (!bedrooms) {
        throw new Error(
          "Please select the number of bedrooms."
        );
      }

      if (!bathrooms) {
        throw new Error(
          "Please select the number of bathrooms."
        );
      }

      if (!serviceCategory) {
        throw new Error(
          "Please select a service."
        );
      }

      if (!selectedPricing) {
        throw new Error(
          "The selected service does not have an active pricing record."
        );
      }

      if (!description) {
        throw new Error(
          "Please enter a description of the work."
        );
      }

      if (!requestedDate) {
        throw new Error(
          "Please select a requested completion date."
        );
      }

      if (!contactName) {
        throw new Error(
          "Contact name is required."
        );
      }

      if (!contactPhone) {
        throw new Error(
          "Contact phone is required."
        );
      }

      const quantity =
        Number(pricingQuantity);

      if (
        !quantity ||
        quantity <= 0
      ) {
        throw new Error(
          "Pricing quantity must be greater than 0."
        );
      }

      const unitPrice =
        Number(
          selectedPricing.price
        );

      const pricingTotal =
        unitPrice * quantity;

      /*
       * -------------------------------------------------------
       * 4. VERIFY PROPERTY
       * -------------------------------------------------------
       */

      const {
        data: propertyRows,
        error: propertyError,
      } = await supabase
        .from("properties")
        .select(
          "id, name, apartment_company_id"
        )
        .eq(
          "id",
          PROPERTY_ID
        )
        .limit(1);

      if (propertyError) {
        console.error(
          "SUPABASE PROPERTY LOOKUP ERROR:",
          {
            message:
              propertyError.message,
            code:
              propertyError.code,
            details:
              propertyError.details,
            hint:
              propertyError.hint,
          }
        );

        throw new Error(
          propertyError.message ||
            "Unable to verify the selected property."
        );
      }

      const property =
        propertyRows?.[0];

      if (!property) {
        throw new Error(
          `Property ${PROPERTY_ID} could not be found.`
        );
      }

      /*
       * -------------------------------------------------------
       * 5. VERIFY PROPERTY COMPANY
       * -------------------------------------------------------
       */

      if (
        property.apartment_company_id !==
        APARTMENT_COMPANY_ID
      ) {
        throw new Error(
          "The selected property is not associated with Elite Apartment Services."
        );
      }

      /*
       * -------------------------------------------------------
       * 6. BUILD INSERT
       * -------------------------------------------------------
       */

      const workOrderPayload = {
        apartment_company_id:
          APARTMENT_COMPANY_ID,

        property_id:
          property.id,

        requested_by:
          user.id,

        /*
         * IMPORTANT:
         *
         * This is the actual service_pricing
         * category, such as:
         *
         * painting_walls_one_color
         *
         * instead of the old generic:
         *
         * painting
         */
        service_category:
          selectedPricing.service_category,

        title:
          `${serviceLabel || formatServiceName(selectedPricing.service_category)} - Unit ${unitNumber}`,

        description,

        priority,

        requested_date:
          requestedDate,

        status:
          "submitted" as const,

        property_name:
          propertyName,

        property_address:
          propertyAddress,

        city,

        state,

        zip,

        service_area:
          serviceArea,

        unit_number:
          unitNumber,

        square_feet:
          squareFeetNumber,

        bedrooms,

        bathrooms,

        occupancy,

        service:
          serviceLabel ||
          formatServiceName(
            selectedPricing.service_category
          ),

        contact_name:
          contactName,

        contact_phone:
          contactPhone,

        access_method:
          accessMethod,

        access_notes:
          accessNotes,

        /*
         * -----------------------------------------------------
         * PRICING FIELDS
         * -----------------------------------------------------
         */

        pricing_id:
          selectedPricing.id,

        pricing_type:
          selectedPricing.pricing_type,

        unit_price:
          unitPrice,

        pricing_quantity:
          quantity,

        pricing_total:
          pricingTotal,

        /*
         * per_estimate is an estimate.
         * Everything else is a calculated price.
         */
        is_estimate:
          selectedPricing.pricing_type ===
          "per_estimate",
      };

      console.log(
        "WORK ORDER INSERT PAYLOAD:",
        workOrderPayload
      );

      /*
       * -------------------------------------------------------
       * 7. INSERT WORK ORDER
       * -------------------------------------------------------
       */

      const {
        data: workOrder,
        error: insertError,
      } = await supabase
        .from("work_orders")
        .insert(
          workOrderPayload
        )
        .select(
          `
            id,
            work_order_number,
            property_id,
            requested_by,
            service_category,
            title,
            description,
            priority,
            requested_date,
            status,
            pricing_id,
            pricing_type,
            unit_price,
            pricing_quantity,
            pricing_total,
            is_estimate,
            created_at
          `
        )
        .single();

      if (insertError) {
        console.error(
          "SUPABASE WORK ORDER INSERT ERROR:",
          {
            message:
              insertError.message,
            code:
              insertError.code,
            details:
              insertError.details,
            hint:
              insertError.hint,
          }
        );

        if (
          insertError.code ===
          "42501"
        ) {
          throw new Error(
            "Supabase denied the work order because of Row Level Security. The authenticated user does not satisfy the work order INSERT policy."
          );
        }

        if (
          insertError.code ===
          "23503"
        ) {
          throw new Error(
            `The work order references a property, company, or pricing record that does not exist. Property ID: ${property.id}`
          );
        }

        if (
          insertError.code ===
          "23505"
        ) {
          throw new Error(
            "The work order could not be created because of a duplicate value."
          );
        }

        if (
          insertError.code ===
          "22P02"
        ) {
          throw new Error(
            `One of the selected values is invalid for the database enum. Database error: ${insertError.message}`
          );
        }

        if (
          insertError.code ===
          "23514"
        ) {
          throw new Error(
            `A database CHECK constraint rejected the work order. Database error: ${insertError.message}`
          );
        }

        throw new Error(
          insertError.message ||
            "Unable to create work order."
        );
      }

      console.log(
        "WORK ORDER CREATED:",
        workOrder
      );

      setSubmitted(true);
    } catch (error) {
      console.error(
        "WORK ORDER ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the work order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/dashboard/work-orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Work Orders
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-600">
                Elite Apartment Services
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                New Work Order
              </h1>
            </div>

          </div>

          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Create a work order with automatic service
            pricing and calculation.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="text-sm font-bold text-red-900">
              Work Order Was Not Created
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>

          </div>
        )}

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-green-950">
              Work Order Created
            </h2>

            <p className="mt-2 text-sm text-green-800">
              The work order and calculated service
              pricing were successfully saved to
              Supabase.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/dashboard/work-orders"
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                View Work Orders
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setErrorMessage("");
                  setSelectedPricingId("");
                  setPricingQuantity("1");
                }}
                className="rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 hover:bg-green-50"
              >
                Create Another
              </button>

            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* PROPERTY INFORMATION */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    <Building2 className="h-4 w-4 text-blue-700" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Property Information
                    </h2>

                    <p className="text-sm text-slate-600">
                      Apartment community and property address.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <div className="md:col-span-2">

                    <label
                      htmlFor="property_name"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Property Name
                    </label>

                    <input
                      id="property_name"
                      name="property_name"
                      required
                      defaultValue="Test Apartment Community"
                      placeholder="Example: The Oaks Apartments"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label
                      htmlFor="property_address"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Property Address
                    </label>

                    <div className="relative">

                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        id="property_address"
                        name="property_address"
                        required
                        defaultValue="123 Main Street"
                        placeholder="Street address"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                  </div>

                  <div>

                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      required
                      defaultValue="San Antonio"
                      placeholder="San Antonio"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="state"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      State
                    </label>

                    <select
                      id="state"
                      name="state"
                      defaultValue="TX"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="TX">
                        Texas
                      </option>
                    </select>

                  </div>

                  <div>

                    <label
                      htmlFor="zip"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      ZIP Code
                    </label>

                    <input
                      id="zip"
                      name="zip"
                      required
                      defaultValue="78233"
                      inputMode="numeric"
                      placeholder="78233"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="service_area"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Service Area
                    </label>

                    <select
                      id="service_area"
                      name="service_area"
                      defaultValue="San Antonio"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="San Antonio">
                        San Antonio
                      </option>

                      <option value="Dallas">
                        Dallas
                      </option>

                      <option value="Houston">
                        Houston
                      </option>

                      <option value="Austin">
                        Austin
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>

                </div>

              </div>

            </section>

            {/* UNIT INFORMATION */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                    <Home className="h-4 w-4 text-indigo-700" />
                  </div>

                  <div>

                    <h2 className="font-semibold text-slate-950">
                      Unit Information
                    </h2>

                    <p className="text-sm text-slate-600">
                      Unit size and configuration used for service pricing.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label
                      htmlFor="unit_number"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Unit Number
                    </label>

                    <input
                      id="unit_number"
                      name="unit_number"
                      required
                      placeholder="Example: 214"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="square_feet"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Square Feet
                    </label>

                    <input
                      id="square_feet"
                      name="square_feet"
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={squareFeet}
                      onChange={(event) =>
                        setSquareFeet(
                          event.target.value
                        )
                      }
                      placeholder="Example: 950"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="bedrooms"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Bedrooms
                    </label>

                    <select
                      id="bedrooms"
                      name="bedrooms"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="" disabled>
                        Select bedroom count
                      </option>

                      {bedroomTypes.map(
                        (bedroom) => (
                          <option
                            key={bedroom}
                            value={bedroom}
                          >
                            {bedroom}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  <div>

                    <label
                      htmlFor="bathrooms"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Bathrooms
                    </label>

                    <select
                      id="bathrooms"
                      name="bathrooms"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="" disabled>
                        Select bathroom count
                      </option>

                      {bathroomTypes.map(
                        (bathroom) => (
                          <option
                            key={bathroom}
                            value={bathroom}
                          >
                            {bathroom}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-3 block text-sm font-semibold text-slate-800">
                      Unit Status
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">

                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">

                        <input
                          type="radio"
                          name="occupancy"
                          value="vacant"
                          defaultChecked
                          className="h-4 w-4"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            Vacant
                          </p>

                          <p className="text-xs text-slate-600">
                            Unit is empty and ready for service.
                          </p>
                        </div>

                      </label>

                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 hover:bg-slate-50">

                        <input
                          type="radio"
                          name="occupancy"
                          value="occupied"
                          className="h-4 w-4"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            Occupied
                          </p>

                          <p className="text-xs text-slate-600">
                            Resident is currently living in the unit.
                          </p>
                        </div>

                      </label>

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* SERVICE REQUEST */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <DollarSign className="h-4 w-4 text-amber-700" />
                  </div>

                  <div>

                    <h2 className="font-semibold text-slate-950">
                      Service Request & Pricing
                    </h2>

                    <p className="text-sm text-slate-600">
                      Select a service and the price will be calculated automatically.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <div>

                  <label
                    htmlFor="service_category"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Service
                  </label>

                  <select
                    id="service_category"
                    name="service_category"
                    required
                    value={selectedPricingId}
                    onChange={handleServiceChange}
                    disabled={loadingPricing}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100"
                  >

                    <option value="">
                      {loadingPricing
                        ? "Loading services..."
                        : "Select a service"}
                    </option>

                    {pricing.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {formatServiceName(
                            item.service_category
                          )}{" "}
                          — $
                          {Number(
                            item.price
                          ).toFixed(2)}{" "}
                          /{" "}
                          {getPricingUnitLabel(
                            item.pricing_type
                          )}
                        </option>
                      )
                    )}

                  </select>

                  <input
                    type="hidden"
                    name="service_label"
                    value={
                      selectedPricing
                        ? formatServiceName(
                            selectedPricing.service_category
                          )
                        : ""
                    }
                    readOnly
                  />

                </div>

                {selectedPricing && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                    <div className="grid gap-5 md:grid-cols-3">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Service
                        </p>

                        <p className="mt-1 text-sm font-bold text-blue-950">
                          {formatServiceName(
                            selectedPricing.service_category
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Pricing Type
                        </p>

                        <p className="mt-1 text-sm font-bold text-blue-950">
                          {
                            pricingTypeLabels[
                              selectedPricing
                                .pricing_type
                            ]
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Unit Price
                        </p>

                        <p className="mt-1 text-lg font-bold text-blue-950">
                          $
                          {selectedPricing.price.toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                )}

                {selectedPricing && (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">

                    <div>

                      <label
                        htmlFor="pricing_quantity"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                      >
                        Quantity
                      </label>

                      <input
                        id="pricing_quantity"
                        name="pricing_quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          pricingQuantity
                        }
                        onChange={(
                          event
                        ) =>
                          setPricingQuantity(
                            event.target.value
                          )
                        }
                        disabled={
                          selectedPricing.pricing_type ===
                          "per_sq_ft"
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-600"
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        {selectedPricing.pricing_type ===
                        "per_sq_ft"
                          ? "Automatically uses the unit square footage."
                          : `Number of ${getPricingUnitLabel(
                              selectedPricing.pricing_type
                            )}s being serviced.`}
                      </p>

                    </div>

                    <div>

                      <label
                        htmlFor="pricing_total_display"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                      >
                        Calculated Total
                      </label>

                      <div
                        id="pricing_total_display"
                        className="flex min-h-[50px] items-center rounded-xl border border-green-200 bg-green-50 px-4 py-3"
                      >

                        <span className="text-2xl font-bold text-green-700">
                          $
                          {calculatedTotal.toFixed(
                            2
                          )}
                        </span>

                        {selectedPricing.pricing_type ===
                          "per_estimate" && (
                          <span className="ml-3 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            Estimate
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                )}

                <div className="mt-5">

                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Description of Work
                  </label>

                  <textarea
                    id="description"
                    required
                    name="description"
                    rows={6}
                    placeholder="Describe the work that needs to be performed..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

                <div className="mt-5">

                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Priority
                  </label>

                  <select
                    id="priority"
                    name="priority"
                    defaultValue="normal"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >

                    <option value="low">
                      Low
                    </option>

                    <option value="normal">
                      Normal
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>

                  </select>

                </div>

              </div>

            </section>

            {/* CONTACT */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                    <User className="h-4 w-4 text-green-700" />
                  </div>

                  <div>

                    <h2 className="font-semibold text-slate-950">
                      Apartment Contact
                    </h2>

                    <p className="text-sm text-slate-600">
                      Person at the property who can coordinate the work.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label
                      htmlFor="contact_name"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Contact Name
                    </label>

                    <div className="relative">

                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        id="contact_name"
                        name="contact_name"
                        required
                        placeholder="Maintenance / Office Contact"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                  </div>

                  <div>

                    <label
                      htmlFor="contact_phone"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Contact Phone
                    </label>

                    <div className="relative">

                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        id="contact_phone"
                        name="contact_phone"
                        required
                        type="tel"
                        placeholder="(210) 555-1234"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* SCHEDULING */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 bg-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                    <CalendarDays className="h-4 w-4 text-purple-700" />
                  </div>

                  <div>

                    <h2 className="font-semibold text-slate-950">
                      Scheduling
                    </h2>

                    <p className="text-sm text-slate-600">
                      When the property needs the work completed.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label
                      htmlFor="requested_date"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Requested Completion Date
                    </label>

                    <input
                      id="requested_date"
                      name="requested_date"
                      required
                      type="date"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="access_method"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Access
                    </label>

                    <select
                      id="access_method"
                      name="access_method"
                      defaultValue="office"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >

                      <option value="office">
                        Pick up key at office
                      </option>

                      <option value="lockbox">
                        Lockbox
                      </option>

                      <option value="maintenance">
                        Maintenance will provide access
                      </option>

                      <option value="resident">
                        Resident will provide access
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>

                <div className="mt-5">

                  <label
                    htmlFor="access_notes"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Access / Special Instructions
                  </label>

                  <textarea
                    id="access_notes"
                    name="access_notes"
                    rows={4}
                    placeholder="Keys, lockbox information, gate instructions, resident instructions, or anything else the technician needs to know."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

              </div>

            </section>

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 pb-10 sm:flex-row sm:justify-end">

              <Link
                href="/dashboard/work-orders"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingPricing ||
                  !selectedPricing
                }
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Creating Work Order..."
                  : "Create Work Order"}
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}