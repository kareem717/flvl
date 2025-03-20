"use client";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import {
  // Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  // CommandShortcut,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building,
  Loader2,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { redirects } from "@/lib/config/redirects";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useAuth } from "@/components/providers/auth-provider";

interface SearchCommandProps
  extends ComponentPropsWithoutRef<typeof CommandDialog> { }
//TODO: Companies not showing

export function SearchCommand({ ...props }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const router = useRouter();
  const { account, bearerToken } = useAuth();

  if (!account || !bearerToken) {
    throw new Error("SearchCommand: No account or bearer token found");
  }

  // Handle keyboard shortcut to open command dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Set up search action with useAction
  const { refetch, data, isLoading } = useQuery({
    queryKey: ["companies-search", searchQuery, account?.id],
    queryFn: async () => {
      const result = await client.company.search.$get({ query: searchQuery }, {
        headers: {
          Authorization: bearerToken,
        },
      });

      return await result.json();
    },
    refetchOnMount: false,
  });


  // Search companies when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setCompanies([]);
      return;
    }

    refetch();
  }, [debouncedQuery, refetch]);

  // Handle company selection
  const handleCompanySelect = (companyId: number) => {
    router.push(redirects.app.company(companyId).root);
    setOpen(false);
  };

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search companies...</span>
          <kbd className="pointer-events-none absolute right-[0.45rem] top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
      <CommandDialog {...props} open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search companies..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              "No results found."
            )}
          </CommandEmpty>
          <CommandGroup heading="Companies">
            {companies.map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => handleCompanySelect(company.id)}
              >
                <Building className="mr-2 h-4 w-4" />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
