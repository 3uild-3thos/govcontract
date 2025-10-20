import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProposalBreadcrumbProps {
  isLoading: boolean;
  simd: string;
}

export default function ProposalBreadcrumb({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLoading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  simd,
}: ProposalBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-white/30">
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="hover:text-foreground">
            <Link href="/proposals">Proposals</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-whitse/40" />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-white/70">
            Proposal Details
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
