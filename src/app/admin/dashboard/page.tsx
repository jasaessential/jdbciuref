
import { getShops } from "@/lib/shops";
import type { Shop } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, Store } from "lucide-react";
import Link from "next/link";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = 'force-dynamic';

async function getShopData() {
    try {
        const allShops = await getShops();
        return { shops: allShops, error: null };
    } catch (error: any) {
        return { shops: [], error: `Failed to fetch shops: ${error.message}` };
    }
}

export default async function AdminDashboardPage() {
  const { shops, error } = await getShopData();

  return (
    <AdminDashboardClient initialShops={shops} error={error}>
        <div className="container mx-auto px-4 py-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight lg:text-4xl">
                Admin Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
                Select a shop to view its detailed performance and analytics.
            </p>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store /> All Shops
                    </CardTitle>
                    <CardDescription>
                        A list of all registered shops in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No shops have been created yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shops.map((shop) => (
                                    <TableRow key={shop.id}>
                                        <TableCell className="font-medium">{shop.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{shop.address}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {shop.createdAt ? new Date(shop.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/admin/shops/${shop.id}`}>
                                                    View Dashboard
                                                    <ChevronRight className="h-4 w-4 ml-2" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </AdminDashboardClient>
  );
}
