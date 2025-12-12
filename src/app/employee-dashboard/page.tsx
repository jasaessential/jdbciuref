
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { getShops } from "@/lib/shops";
import { getOrdersBySeller, getOrderSettings, markDeliveryFeeAsPaid, getAllOrders } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import type { Shop, Order, UserProfile, OrderSettings } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Package, FileText, Phone, Truck, MapPin, Store, DollarSign, Search, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getAllUsers } from "@/lib/users";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";


type GroupedOrders = {
  [groupId: string]: {
    orders: Order[];
    createdAt: any;
    user: UserProfile;
    customerMobile: string;
    shippingAddress: any;
  };
};

export default function EmployeeDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allAssignedOrders, setAllAssignedOrders] = useState<Order[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [orderSettings, setOrderSettings] = useState<OrderSettings | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFee, setIsUpdatingFee] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [fetchedShops, fetchedSettings, fetchedUsers] = await Promise.all([
          getShops(),
          getOrderSettings(),
          getAllUsers(),
      ]);

      setAllShops(fetchedShops);
      setOrderSettings(fetchedSettings);
      setAllUsers(fetchedUsers);

      const shopsForEmployee = fetchedShops.filter(shop => shop.employeeIds?.includes(user.uid));
      
      if (shopsForEmployee.length > 0) {
        const allOrdersPromises = shopsForEmployee.map(shop => getOrdersBySeller(shop.id));
        const ordersFromAllShops = (await Promise.all(allOrdersPromises)).flat();
        setAllAssignedOrders(ordersFromAllShops);
      } else {
        setAllAssignedOrders([]);
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load dashboard data." });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes("employee")) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        router.push("/");
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading, router, toast, fetchDashboardData]);
  
  const handleMarkFeeAsPaid = async (groupId: string) => {
    if (!groupId) return;
    setIsUpdatingFee(groupId);
    try {
        await markDeliveryFeeAsPaid(groupId);
        toast({ title: "Success", description: "Delivery fee marked as paid."});
        fetchDashboardData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to update fee status: ${error.message}`});
    } finally {
        setIsUpdatingFee(null);
    }
  };

  const handleSearch = () => {
    if (!searchQuery) {
        setSearchedUser(null);
        return;
    }
    setIsSearching(true);
    const foundUser = allUsers.find(u => u.shortId.toLowerCase() === searchQuery.toLowerCase());
    if (foundUser) {
        setSearchedUser(foundUser);
    } else {
        setSearchedUser(null);
        toast({
            variant: "destructive",
            title: "User Not Found",
            description: "No user found with that ID.",
        });
    }
    setIsSearching(false);
  };
  
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied to Clipboard",
      description: `Customer ID: ${id}`,
    });
  };

  const groupedOrders = useMemo((): GroupedOrders => {
    if (!allAssignedOrders || !user) return {};
    const relevantStatuses: Order['status'][] = ["Processing", "Packed", "Shipped", "Out for Delivery", "Return Approved", "Out for Pickup", "Picked Up", "Replacement Confirmed"];
    const usersMap = new Map(allUsers.map(u => [u.uid, u]));

    return allAssignedOrders.reduce((acc, order) => {
      // Only include orders that need action
      if (!relevantStatuses.includes(order.status)) return acc;

      const groupId = order.groupId;
      if (!acc[groupId]) {
        const orderUser = usersMap.get(order.userId);
        if (orderUser) {
            acc[groupId] = {
              orders: [],
              createdAt: order.createdAt,
              shippingAddress: order.shippingAddress,
              customerMobile: order.mobile,
              user: orderUser,
            };
        }
      }
      if (acc[groupId]) {
        acc[groupId].orders.push(order);
      }
      return acc;
    }, {} as GroupedOrders);
  }, [allAssignedOrders, user, allUsers]);

  const sortedGroupIds = useMemo(() => {
    return Object.keys(groupedOrders).sort((a, b) => {
        return (groupedOrders[b].createdAt?.seconds || 0) - (groupedOrders[a].createdAt?.seconds || 0);
    });
  }, [groupedOrders]);

  const searchedUserOrders = useMemo(() => {
    if (!searchedUser) return {};
    const usersMap = new Map(allUsers.map(u => [u.uid, u]));
    
    return allAssignedOrders.reduce((acc, order) => {
        if (order.userId !== searchedUser.uid) return acc;

        const groupId = order.groupId;
        if (!acc[groupId]) {
          const orderUser = usersMap.get(order.userId);
          if (orderUser) {
              acc[groupId] = {
                orders: [],
                createdAt: order.createdAt,
                shippingAddress: order.shippingAddress,
                customerMobile: order.mobile,
                user: orderUser,
              };
          }
        }
        if (acc[groupId]) {
          acc[groupId].orders.push(order);
        }
        return acc;
    }, {} as GroupedOrders);
  }, [allAssignedOrders, searchedUser, allUsers]);
  
  const renderOrderGroupCard = (groupId: string, group: GroupedOrders[string]) => {
    const firstOrder = group.orders[0];
    const address = firstOrder.shippingAddress;


    const ordersBySeller = group.orders.reduce((acc, order) => {
        if (!acc[order.sellerId]) {
            acc[order.sellerId] = [];
        }
        acc[order.sellerId].push(order);
        return acc;
    }, {} as Record<string, Order[]>);

    const productItems = group.orders.filter(order => order.category !== 'xerox');
    const xeroxItems = group.orders.filter(order => order.category === 'xerox');
    
    const itemsSubtotal = productItems.reduce((sum, order) => sum + (order.price * order.quantity), 0);
    const xeroxSubtotal = xeroxItems.reduce((sum, order) => sum + (order.price * order.quantity), 0);

    const totalDeliveryFee = group.orders.reduce((sum, order) => sum + order.deliveryCharge, 0);

    const subtotal = itemsSubtotal + xeroxSubtotal;
    const total = subtotal + totalDeliveryFee;
    const isDeliveryFeePaid = group.orders.every(o => o.isDeliveryFeePaid);

    return (
        <Card key={groupId} className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                        Group ID: <span className="font-mono text-sm">{groupId}</span>
                    </CardTitle>
                        <p className="text-sm text-muted-foreground flex-shrink-0">
                        {group.orders.length} item(s)
                    </p>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <Card className="bg-muted/30">
                    <CardContent className="p-4 text-sm">
                        <Table>
                            <TableBody>
                            <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1">Customer ID</TableCell>
                                <TableCell className="font-semibold p-1 flex items-center gap-1">
                                    {group.user.shortId}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(group.user.shortId)}>
                                    <Copy className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1">Customer</TableCell>
                                <TableCell className="font-semibold p-1">{group.user.name}</TableCell>
                            </TableRow>
                            <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1">Mobile</TableCell>
                                <TableCell className="font-semibold p-1">{group.customerMobile}</TableCell>
                            </TableRow>
                            {firstOrder.altMobiles && firstOrder.altMobiles.length > 0 && (
                                <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1 align-top">Alt. Mobiles</TableCell>
                                <TableCell className="font-semibold p-1">{firstOrder.altMobiles.map(m => m.value).join(', ')}</TableCell>
                                </TableRow>
                            )}
                            <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1 align-top">Address</TableCell>
                                <TableCell className="font-semibold p-1">
                                    <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                                    <p>{address.city}, {address.state} - {address.postalCode}</p>
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-0">
                                <TableCell className="font-bold w-[100px] p-1">Ordered On</TableCell>
                                <TableCell className="font-semibold p-1">{format(group.createdAt.toDate(), 'PPP p')}</TableCell>
                            </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

               <p className="text-sm font-medium">Items in this Delivery:</p>
               {Object.entries(ordersBySeller).map(([sellerId, sellerOrders]) => {
                    const shop = allShops.find(s => s.id === sellerId);
                    return (
                        <div key={sellerId} className="border rounded-lg p-3 bg-muted/50">
                            <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                <Store className="h-4 w-4" /> {shop?.name || 'Unknown Shop'}
                            </h3>
                            <div className="space-y-1">
                                {sellerOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center text-sm gap-2 p-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {order.category === 'xerox' ? <FileText className="h-5 w-5 flex-shrink-0"/> : <Package className="h-5 w-5 flex-shrink-0"/>}
                                            <p className="font-medium truncate">{order.productName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant="outline" className="font-mono">Qty: {order.quantity}</Badge>
                                            <Badge variant={order.status.includes("Cancelled") || order.status.includes("Rejected") ? "destructive" : "secondary"} className="w-28 justify-center text-center">{order.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
               <Separator className="my-2" />
                <div className="text-sm space-y-1">
                    <div className="flex justify-between"><p>Subtotal:</p> <p>Rs {subtotal.toFixed(2)}</p></div>
                    {totalDeliveryFee > 0 && (
                        <div className="flex justify-between text-destructive items-center">
                          <p>Delivery Fee:</p> 
                          <div className="flex items-center gap-2">
                            <p>Rs {totalDeliveryFee.toFixed(2)}</p>
                            <Badge variant={isDeliveryFeePaid ? "default" : "destructive"} className={isDeliveryFeePaid ? "bg-green-600" : ""}>
                              {isDeliveryFeePaid ? "Paid" : "Not Paid"}
                            </Badge>
                          </div>
                        </div>
                    )}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg"><p>Total:</p> <p>Rs {total.toFixed(2)}</p></div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                {totalDeliveryFee > 0 && !isDeliveryFeePaid && (
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={isUpdatingFee === groupId}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          {isUpdatingFee === groupId ? "Updating..." : "Mark Delivery Fee as Paid"}
                        </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you have collected the delivery fee of Rs {totalDeliveryFee.toFixed(2)} for this order group?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleMarkFeeAsPaid(groupId)}>
                            Yes, Mark as Paid
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                )}
                <Button asChild className="w-full">
                    <Link href={`/employee-dashboard/${groupId}`}>View & Update Status</Link>
                </Button>
            </CardFooter>
        </Card>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">Employee Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Loading your assigned deliveries...</p>
        <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
        Employee Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        Overview of all pending delivery orders from your assigned shops.
      </p>

      <Tabs defaultValue="all-orders" className="mt-8">
        <div className="sticky top-20 z-10 bg-background py-2 flex items-center gap-2">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all-orders">Manage All Orders</TabsTrigger>
                <TabsTrigger value="search">Search by Customer ID</TabsTrigger>
            </TabsList>
            <Button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="icon"
                aria-label="Refresh orders"
            >
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
            </Button>
        </div>
        <TabsContent value="all-orders">
            {sortedGroupIds.length === 0 ? (
                <Card className="mt-8 text-center py-16">
                <CardHeader>
                    <Truck className="mx-auto h-16 w-16 text-muted-foreground" />
                    <CardTitle className="mt-4">All Caught Up!</CardTitle>
                    <CardDescription>There are no delivery orders assigned to you right now.</CardDescription>
                </CardHeader>
                </Card>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                   {sortedGroupIds.map(groupId => renderOrderGroupCard(groupId, groupedOrders[groupId]))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="search">
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Search for a Customer's Orders</CardTitle>
                    <CardDescription>Enter a customer's profile ID to find all their orders assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter Customer Profile ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            <Search className="mr-2 h-4 w-4" />
                            {isSearching ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            {searchedUser && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Results for {searchedUser.name}</h2>
                    {Object.keys(searchedUserOrders).length === 0 ? (
                         <Card className="mt-4 text-center py-16">
                            <CardHeader>
                                <Package className="mx-auto h-16 w-16 text-muted-foreground" />
                                <CardTitle className="mt-4">No Orders Found</CardTitle>
                                <CardDescription>This customer has no orders assigned to you.</CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {Object.keys(searchedUserOrders).map(groupId => renderOrderGroupCard(groupId, searchedUserOrders[groupId]))}
                        </div>
                    )}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
