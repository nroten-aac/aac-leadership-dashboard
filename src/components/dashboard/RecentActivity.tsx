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
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-4">Recent Donations</h3>
      {recentDonations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No donations recorded yet</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-xs">Member</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-right text-xs">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentDonations.map((d, i) => (
              <TableRow key={i} className="border-border/30">
                <TableCell className="font-medium text-sm">
                  {d.members ? `${d.members.first_name} ${d.members.last_name}` : "Anonymous"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs rounded-lg">
                    {d.donation_type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(d.donation_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">
                  ${d.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default RecentActivity;
