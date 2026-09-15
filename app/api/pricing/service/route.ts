import { NextResponse } from "next/server";
import { getServicePricing } from "@/lib/pricing/get-service-pricing";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const serviceCategory =
      searchParams.get("service_category");

    if (!serviceCategory) {
      return NextResponse.json(
        {
          error:
            "service_category is required.",
        },
        {
          status: 400,
        }
      );
    }

    const pricing =
      await getServicePricing(
        serviceCategory
      );

    if (!pricing) {
      return NextResponse.json(
        {
          pricing: null,
        },
        {
          status: 200,
        }
      );
    }

    return NextResponse.json({
      pricing,
    });
  } catch (error) {
    console.error(
      "PRICING API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load pricing.",
      },
      {
        status: 500,
      }
    );
  }
}
