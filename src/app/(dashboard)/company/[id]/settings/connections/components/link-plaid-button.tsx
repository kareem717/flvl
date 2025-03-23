// "use client";

// import { Button } from "@/components/ui/button";
// import { usePlaidLink } from "react-plaid-link";
// import {
//   useState,
//   useEffect,
//   type ComponentPropsWithoutRef,
// } from "react";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";
// import { Loader2 } from "lucide-react";
// import { useMutation } from "@tanstack/react-query";
// import { client } from "@/lib/client";
// import { useAuth } from "@/components/providers/auth-provider";

// interface LinkPlaidButtonProps extends ComponentPropsWithoutRef<typeof Button> {
//   companyId: number;
// }

// export function LinkPlaidButton({
//   className,
//   companyId,
//   ...props
// }: LinkPlaidButtonProps) {
//   const [token, setToken] = useState<string>("");
//   const [publicToken, setPublicToken] = useState<string>("");
//   const { bearerToken } = useAuth()
//   const [isLoading, setIsLoading] = useState(false)

//   if (!bearerToken) {
//     throw new Error("LinkPlaidButton: No bearer token found")
//   }

//   const { mutate: createPlaidLinkToken } = useMutation({
//     mutationFn: async () => {
//       const resp = await client.company.createPlaidLinkToken.$post({
//         companyId,
//       }, {
//         headers: {
//           Authorization: bearerToken,
//         },
//       })
//       return resp.json()
//     },
//     onMutate: () => setIsLoading(true),
//     onSuccess: (result) => {
//       setToken(result.linkToken);
//     },
//     onError: () => {
//       setIsLoading(false)
//       toast.error("Uh oh!", {
//         description: "An error occurred, please try again.",
//         action: {
//           label: "Try again",
//           onClick: () => {
//             createPlaidLinkToken();
//           },
//         },
//       });
//     },
//   });

//   const { mutate: swap } = useMutation({
//     mutationFn: async (publicToken: string) => {
//       const resp = await client.company.swapPlaidPublicToken.$post({
//         companyId,
//         publicToken,
//       }, {
//         headers: {
//           Authorization: bearerToken,
//         },
//       })
//       return resp.json()
//     },
//     onSuccess: () => {
//       toast.success("Done!", {
//         description: "Your financial accounts were linked successfully.",
//       });
//     },
//     onError: () => {
//       toast.error("Uh oh!", {
//         description: "An error occurred, please try again.",
//         action: {
//           label: "Try again",
//           onClick: () => {
//             swap(publicToken);
//           },
//         },
//       });
//     },
//     onSettled: () => setIsLoading(false)
//   })

//   const { open, ready } = usePlaidLink({
//     token,
//     onSuccess: (publicToken) => {
//       setPublicToken(publicToken);
//       swap(publicToken);
//     },
//   });

//   // Use useEffect to call open() after token is set and Link is ready
//   useEffect(() => {
//     if (token && ready) {
//       open();
//     }
//   }, [token, ready, open]);

//   return (
//     <Button
//       className={cn(className)}
//       onClick={() => createPlaidLinkToken()}
//       disabled={isLoading}
//       {...props}
//     >
//       {isLoading && <Loader2 className="mr-2 animate-spin" />}
//       Link Plaid
//     </Button>
//   );
// }
