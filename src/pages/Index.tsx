// src/pages/Index.tsx
import { useState, useEffect } from "react";
import {
  getConfig,
  getStatus,
  openDay,
  closeDay,
  syncQueue,
  getQueue
} from "@/lib/api";

import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Activity, Clock, FileText, CheckCircle,
  XCircle, Info, BellOff, Send, FileCheck, FileX
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  date: Date;
  status: 'signed' | 'sent' | 'excluded';
}

interface ReceiptItem {
  receipt: {
    invoice_number?: string;
    total?: number;
    date?: string;
  };
  pdf_path?: string;
}

interface ConfigData {
  trade_name?: string;
  tin?: string;
  vat_number?: string;
  platform?: string;
  serial_number?: string;
  device_id?: string;
  fiscalisation_mode?: string;
  environment?: string;
  token_loaded?: boolean;
}

const Index = () => {
  const [clientName, setClientName] = useState("Client");
  const [isOnline, setIsOnline] = useState(true);
  const [fiscalDayStatus, setFiscalDayStatus] = useState("UNKNOWN");
  const [watcherRunning, setWatcherRunning] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<ConfigData>({});

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), timestamp: new Date(), type, message },
      ...prev.slice(0, 49)
    ]);
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getStatus();
        setIsOnline(data.online);
        setFiscalDayStatus(data.fiscal_day_status || "UNKNOWN");
        setWatcherRunning(data.watcher_running);
      } catch {
        setIsOnline(false);
        setFiscalDayStatus("UNKNOWN");
        addLog("error", "Failed to fetch status — possibly offline");
      }
    };

    const fetchInvoices = async () => {
      try {
        const data: ReceiptItem[] = await getQueue();
        const mappedInvoices = data.map((item, index) => ({
          id: index.toString(),
          number: item.receipt?.invoice_number || `INV-${index + 1}`,
          amount: item.receipt?.total || 0,
          date: new Date(item.receipt?.date || Date.now()),
          status: 'signed' as const,
        }));
        setInvoices(mappedInvoices);
      } catch {
        addLog("error", "Failed to fetch receipt queue");
      }
    };

    const loadConfigAndClientName = async () => {
      try {
        const fetched = await getConfig();
        setConfig(fetched);
        const name = fetched.trade_name || "Client";
        localStorage.setItem("clientName", name);
        setClientName(name);
        addLog("success", "System config loaded");
      } catch {
        addLog("error", "Failed to load config");
      }
    };

    loadConfigAndClientName();
    fetchStatus();
    fetchInvoices();
    const interval = setInterval(() => {
      fetchStatus();
      fetchInvoices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenDay = async () => {
    try {
      const res = await openDay();
      if (res.success) {
        setFiscalDayStatus("OPEN");
        addLog("success", "Fiscal day opened");
      } else {
        addLog("error", res.message || "Failed to open fiscal day");
      }
    } catch {
      addLog("error", "Backend error: failed to open day");
    }
  };

  const handleCloseDay = async () => {
    try {
      const res = await closeDay();
      if (res.success) {
        setFiscalDayStatus("CLOSE_INITIATED");
        addLog("success", "Fiscal day close initiated");
      } else {
        addLog("error", res.message || "Failed to close fiscal day");
      }
    } catch {
      addLog("error", "Backend error: failed to close day");
    }
  };

  const handleForceSync = async () => {
    addLog("info", "Force sync initiated...");
    try {
      const res = await syncQueue();
      if (res.success) {
        addLog("success", res.message || "Receipts synced successfully");
      } else {
        addLog("error", res.message || "Sync failed");
      }
    } catch {
      addLog("error", "Backend error during sync");
    }
  };

  const handleGetStatus = async () => {
    addLog("info", "Getting system status...");
    try {
      const data = await getStatus();
      setIsOnline(data.online);
      setWatcherRunning(data.watcher_running);
      setFiscalDayStatus(data.fiscal_day_status || "UNKNOWN");
      addLog("success", `Fiscal Day Status: ${data.fiscal_day_status || "UNKNOWN"}`);
    } catch {
      addLog("error", "Failed to get system status");
    }
  };

  const handleGetConfig = async () => {
    addLog("info", "Getting system config...");
    try {
      const fetched = await getConfig();
      setConfig(fetched);
      addLog("success", "Configuration retrieved successfully");
    } catch {
      addLog("error", "Failed to retrieve configuration");
    }
  };

  const getStatusColor = (status: boolean) => status ? "bg-green-500" : "bg-red-500";
  const getLogIcon = (type: LogEntry['type']) =>
    type === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> :
      type === "error" ? <XCircle className="h-4 w-4 text-red-600" /> :
        <Info className="h-4 w-4 text-blue-600" />;

  const getInvoicesByStatus = (status: Invoice['status']) =>
    invoices.filter(i => i.status === status);

  const getStatusBadgeVariant = (status: Invoice['status']) =>
    status === "signed" ? "default" :
      status === "sent" ? "secondary" : "destructive";

  const getStatusIcon = (status: Invoice['status']) =>
    status === "signed" ? <FileCheck className="h-4 w-4 text-green-600" /> :
      status === "sent" ? <Send className="h-4 w-4" /> :
        <FileX className="h-4 w-4" />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between">
          <div className="text-lg font-semibold text-gray-700">Fiscal System Version 1.0.0.4</div>
          <div className="text-lg font-semibold text-gray-700">{clientName}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Activity className="h-4 w-4 mr-2" />Operating Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(isOnline)}`} />
                <span className="font-medium text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2" />Fiscal Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-xs">
                {fiscalDayStatus.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />File Watcher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(watcherRunning)}`} />
                <span className="font-medium text-sm">{watcherRunning ? 'Running' : 'Stopped'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Operations</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleOpenDay} size="sm" className="bg-green-600 hover:bg-green-700">Open Fiscal Day</Button>
              <Button onClick={handleCloseDay} variant="destructive" size="sm">Close Fiscal Day</Button>
              <Separator orientation="vertical" className="h-6" />
              <Button onClick={handleForceSync} variant="outline" size="sm">Force Sync</Button>
              <Button onClick={handleGetStatus} variant="outline" size="sm">Get Status</Button>
              <Button onClick={handleGetConfig} variant="outline" size="sm">Get Config</Button>
            </div>
          </CardContent>
        </Card>

        {/* ✅ Receipt Centre Tabs */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Receipt Centre</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="signed" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                {["signed", "sent", "excluded"].map(s => (
                  <TabsTrigger key={s} value={s} className="flex items-center gap-1 text-xs">
                    {getStatusIcon(s as Invoice['status'])}
                    {s.charAt(0).toUpperCase() + s.slice(1)} ({getInvoicesByStatus(s as Invoice['status']).length})
                  </TabsTrigger>
                ))}
              </TabsList>
              {["signed", "sent", "excluded"].map(s => (
                <TabsContent key={s} value={s} className="mt-2">
                  {getInvoicesByStatus(s as Invoice['status']).length > 0 ? (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-xs">Invoice #</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {getInvoicesByStatus(s as Invoice['status']).map(inv => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs">{inv.number}</TableCell>
                            <TableCell className="text-xs">{inv.date.toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs">${inv.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(inv.status)} className="flex items-center gap-1 w-fit text-xs h-5">
                                {getStatusIcon(inv.status)}
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-xs text-gray-500 p-4">No {s} invoices found.</div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Config Viewer */}
        {Object.keys(config).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Current Config</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1">
              {Object.entries(config).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b py-1">
                  <span className="font-medium text-gray-600">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-800">{String(val)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {!isOnline && (
          <Alert className="py-2">
            <BellOff className="h-4 w-4" />
            <AlertDescription className="text-sm">
              System is offline. Invoices will queue until connection restores.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2" />Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50">
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{log.message}</p>
                    <p className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
