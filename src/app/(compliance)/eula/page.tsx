import { Metadata } from "next";

export const metadata: Metadata = {
  title: "End User License Agreement",
};

export default async function EULAPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <h1>End User License Agreement</h1>
    </div>
  );
}
