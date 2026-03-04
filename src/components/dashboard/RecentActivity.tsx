import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentActivityProps {
  donations: Array<{
    amount: number;
    donation_date: string;
    donation_type: string;
    members: { first_name: string; last_name: string } | null;
  }>;
  attendance: Array<{
    event_date: string;
    service: string;
    adjusted_total: number;
    notes: string | null;
  }>;
}

const RecentActivity = ({ donations }: RecentActivityProps) => {
  const recentDonations = [...donations]
    .sort((a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Recent Donations</CardTitle>
      </CardHeader>
      <CardContent>
        {recentDonations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No donations recorded yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDonations.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {d.members ? `${d.members.first_name} ${d.members.last_name}` : "Anonymous"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {d.donation_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(d.donation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${d.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
