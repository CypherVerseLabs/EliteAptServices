import {
  createPricingItem,
  updatePricingItem,
} from "./actions";

type PriceList = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type PricingItem = {
  id: string;
  price_list_id: string;
  category_id: string;
  name: string;
  abbreviation: string | null;
  description: string | null;
  pricing_type: string;
  unit: string | null;
  price: number;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  active: boolean;
  sort_order: number;
};

type Props = {
  priceLists: PriceList[];
  categories: Category[];
  item?: PricingItem;
  selectedPriceListId?: string;
};

const pricingTypes = [
  {
    value: "flat",
    label: "Flat Price",
  },
  {
    value: "per_sq_ft",
    label: "Per Square Foot",
  },
  {
    value: "per_wall",
    label: "Per Wall",
  },
  {
    value: "per_room",
    label: "Per Room",
  },
  {
    value: "per_unit",
    label: "Per Unit",
  },
  {
    value: "per_item",
    label: "Per Item",
  },
  {
    value: "per_area",
    label: "Per Area",
  },
  {
    value: "per_estimate",
    label: "Estimate",
  },
];

export default function PricingForm({
  priceLists,
  categories,
  item,
  selectedPriceListId,
}: Props) {
  const isEditing = Boolean(item);

  const action = isEditing
    ? updatePricingItem
    : createPricingItem;

  return (
    <form
      action={action}
      className="space-y-6"
    >
      {isEditing && (
        <input
          type="hidden"
          name="id"
          value={item!.id}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="font-semibold text-slate-900">
            {isEditing
              ? "Edit Pricing Item"
              : "Add Pricing Item"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the service, company abbreviation,
            pricing method, and rate.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="price_list_id"
              className="block text-sm font-semibold text-slate-700"
            >
              Price List
            </label>

            <select
              id="price_list_id"
              name="price_list_id"
              required
              defaultValue={
                item?.price_list_id ??
                selectedPriceListId ??
                priceLists[0]?.id ??
                ""
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {priceLists.map((priceList) => (
                <option
                  key={priceList.id}
                  value={priceList.id}
                >
                  {priceList.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category_id"
              className="block text-sm font-semibold text-slate-700"
            >
              Category
            </label>

            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={
                item?.category_id ??
                categories[0]?.id ??
                ""
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-700"
            >
              Service Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={
                item?.name ?? ""
              }
              placeholder="Example: Walls - One Color"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="abbreviation"
              className="block text-sm font-semibold text-slate-700"
            >
              Company Abbreviation
            </label>

            <input
              id="abbreviation"
              name="abbreviation"
              type="text"
              defaultValue={
                item?.abbreviation ?? ""
              }
              placeholder="Example: FPW-CC"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            <p className="mt-1 text-xs text-slate-400">
              Use the abbreviation used internally by Elite.
            </p>
          </div>

          <div>
            <label
              htmlFor="pricing_type"
              className="block text-sm font-semibold text-slate-700"
            >
              Pricing Type
            </label>

            <select
              id="pricing_type"
              name="pricing_type"
              required
              defaultValue={
                item?.pricing_type ??
                "flat"
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              {pricingTypes.map(
                (pricingType) => (
                  <option
                    key={pricingType.value}
                    value={pricingType.value}
                  >
                    {pricingType.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-semibold text-slate-700"
            >
              Unit
            </label>

            <input
              id="unit"
              name="unit"
              type="text"
              defaultValue={
                item?.unit ?? ""
              }
              placeholder="sq ft, wall, room, each, job"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-slate-700"
            >
              Price
            </label>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                $
              </span>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={
                  item?.price ?? 0
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-8 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sort_order"
              className="block text-sm font-semibold text-slate-700"
            >
              Sort Order
            </label>

            <input
              id="sort_order"
              name="sort_order"
              type="number"
              step="1"
              defaultValue={
                item?.sort_order ?? 0
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="minimum_quantity"
              className="block text-sm font-semibold text-slate-700"
            >
              Minimum Quantity
            </label>

            <input
              id="minimum_quantity"
              name="minimum_quantity"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                item?.minimum_quantity ??
                ""
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="maximum_quantity"
              className="block text-sm font-semibold text-slate-700"
            >
              Maximum Quantity
            </label>

            <input
              id="maximum_quantity"
              name="maximum_quantity"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                item?.maximum_quantity ??
                ""
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={
                item?.description ?? ""
              }
              placeholder="Internal description or pricing notes."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                name="active"
                defaultChecked={
                  item?.active ?? true
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Active pricing item
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Inactive items remain in the database but
                  won't be available for new work.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <a
          href="/dashboard/pricing"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {isEditing
            ? "Save Changes"
            : "Add Pricing Item"}
        </button>
      </div>
    </form>
  );
}