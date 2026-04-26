import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FacilityTable({ facilities, query }) {
  return (
    <div className="border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Facility</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Capabilities</TableHead>
            <TableHead className="w-24">Score</TableHead>
            <TableHead className="w-24">Trust</TableHead>
            <TableHead className="w-20">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facilities.map((facility) => (
            <TableRow key={facility.id}>
              <TableCell className="font-medium">{facility.name}</TableCell>
              <TableCell>{facility.location}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {facility.structured.capabilities.map((capability) => (
                    <Badge key={`${facility.id}-${capability}`}>{capability}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{facility.score}</TableCell>
              <TableCell>{facility.trustScore}</TableCell>
              <TableCell>
                <Link
                  className="text-teal-700 hover:text-teal-800 text-xs font-semibold"
                  href={`/facility/${facility.id}?query=${encodeURIComponent(query)}`}
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
