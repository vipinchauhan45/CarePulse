import React from "react";
import { VitalRecord } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VitalsHistoryTableProps {
  data: VitalRecord[];
}

const VitalsHistoryTable: React.FC<VitalsHistoryTableProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead className="text-center">HR</TableHead>
            <TableHead className="text-center">RR</TableHead>
            <TableHead className="text-center">BP</TableHead>
            <TableHead className="text-center">SpO₂</TableHead>
            <TableHead className="text-center">Temp</TableHead>
            <TableHead className="text-center">MAP</TableHead>
            <TableHead className="text-center">EtCO₂</TableHead>
            <TableHead className="text-center">FiO₂</TableHead>
            <TableHead className="text-center">TV</TableHead>
            <TableHead className="text-center">CVP</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                No historical records found
              </TableCell>
            </TableRow>
          ) : (
            data.slice(0, 50).map((record) => (
              <TableRow key={record._id}>
                <TableCell className="font-mono text-xs">
                  {formatDate(record.recordedAt)}
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.heartRate}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.respiratoryRate}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.bloodPressure}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.oxygenSaturation}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {typeof record.temperature === "number" ? record.temperature.toFixed(1) : "--"}
                  </Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.meanArterialPressure}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.endTidalCO2}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.fiO2}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.tidalVolume}</Badge>
                </TableCell>

                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{record.centralVenousPressure}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default VitalsHistoryTable;
