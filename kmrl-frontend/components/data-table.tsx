"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconCircleFilled,
  IconTrendingUp,
} from "@tabler/icons-react"

export const schema = z.object({
  id: z.number(),
  trainName: z.string(),
  trainStatus: z.enum(["On Time", "Delayed", "Under Maintenance"]),
  estimatedArrival: z.string(),
  source: z.string(),
  destination: z.string(),
  passengers: z.number(),
  bogies: z.number(),
  description: z.string(),
})

// Demo data for 10 trains in the Kochi area (India) with additional fields
const demoData: z.infer<typeof schema>[] = [
  {
    id: 1,
    trainName: "Kochi Express",
    trainStatus: "On Time",
    estimatedArrival: "08:30",
    source: "Kochi",
    destination: "Thiruvananthapuram",
    passengers: 1200,
    bogies: 18,
    description: "A popular express train connecting Kochi to the capital city, known for its scenic coastal route."
  },
  {
    id: 2,
    trainName: "Ernakulam Shatabdi",
    trainStatus: "Delayed",
    estimatedArrival: "09:45",
    source: "Kochi",
    destination: "Kozhikode",
    passengers: 800,
    bogies: 14,
    description: "A high-speed Shatabdi service offering premium amenities for business travelers."
  },
  {
    id: 3,
    trainName: "Alleppey Intercity",
    trainStatus: "Under Maintenance",
    estimatedArrival: "N/A",
    source: "Kochi",
    destination: "Alappuzha",
    passengers: 0,
    bogies: 12,
    description: "A short-route intercity train, ideal for quick trips to the backwaters of Alappuzha."
  },
  {
    id: 4,
    trainName: "Vembanad Express",
    trainStatus: "On Time",
    estimatedArrival: "11:20",
    source: "Kochi",
    destination: "Kottayam",
    passengers: 950,
    bogies: 16,
    description: "Named after Vembanad Lake, this train offers a comfortable journey through Kerala's heartland."
  },
  {
    id: 5,
    trainName: "Malabar Express",
    trainStatus: "Delayed",
    estimatedArrival: "14:15",
    source: "Kochi",
    destination: "Mangalore",
    passengers: 1100,
    bogies: 20,
    description: "A long-distance train connecting Kochi to the vibrant port city of Mangalore."
  },
  {
    id: 6,
    trainName: "Jan Shatabdi",
    trainStatus: "On Time",
    estimatedArrival: "12:50",
    source: "Kochi",
    destination: "Thrissur",
    passengers: 700,
    bogies: 15,
    description: "A budget-friendly Shatabdi service for daily commuters and travelers to Thrissur."
  },
  {
    id: 7,
    trainName: "Netravati Express",
    trainStatus: "Under Maintenance",
    estimatedArrival: "N/A",
    source: "Kochi",
    destination: "Mumbai",
    passengers: 0,
    bogies: 22,
    description: "A major train linking Kochi to Mumbai, popular among tourists and professionals."
  },
  {
    id: 8,
    trainName: "Parasuram Express",
    trainStatus: "On Time",
    estimatedArrival: "16:30",
    source: "Kochi",
    destination: "Nagercoil",
    passengers: 1000,
    bogies: 18,
    description: "A reliable train serving southern Kerala and Tamil Nadu, known for its punctuality."
  },
  {
    id: 9,
    trainName: "Island Express",
    trainStatus: "Delayed",
    estimatedArrival: "18:40",
    source: "Kochi",
    destination: "Kanyakumari",
    passengers: 1300,
    bogies: 21,
    description: "A scenic route to the southern tip of India, offering stunning coastal views."
  },
  {
    id: 10,
    trainName: "Venad Express",
    trainStatus: "On Time",
    estimatedArrival: "10:25",
    source: "Kochi",
    destination: "Shoranur",
    passengers: 850,
    bogies: 17,
    description: "A convenient train for travelers heading to Shoranur, a major railway junction."
  },
]

export const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    accessorKey: "trainName",
    header: () => <div className="pl-5">Train Name</div>,
    cell: ({ row }) => (
      <div className="pl-5">
        <TableCellViewer item={row.original} />
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "trainStatus",
    header: "Train Status",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.trainStatus === "On Time" ? (
            <IconCircleFilled className="fill-green-500 dark:fill-green-400 mr-1 size-3" />
          ) : row.original.trainStatus === "Delayed" ? (
            <IconCircleFilled className="fill-yellow-500 dark:fill-yellow-400 mr-1 size-3" />
          ) : (
            <IconCircleFilled className="fill-red-500 dark:fill-red-400 mr-1 size-3" />
          )}
          {row.original.trainStatus}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "estimatedArrival",
    header: "Estimated Arrival",
    cell: ({ row }) => (
      <div className="w-24 text-left">{row.original.estimatedArrival}</div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <div className="w-32">{row.original.source}</div>
    ),
  },
  {
    accessorKey: "destination",
    header: "Destination",
    cell: ({ row }) => (
      <div className="w-32">{row.original.destination}</div>
    ),
  },
]

export function DataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const chartData = [
  { month: "Device Used To Book", desktop: 186, mobile: 80 },
  { month: "Device Used To Book", desktop: 305, mobile: 200 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.trainName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.trainName}</DrawerTitle>
          <DrawerDescription>
            Train details and performance metrics
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={true} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing performance metrics for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Number of Passengers</span>
              <span>{item.passengers}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Number of Bogies</span>
              <span>{item.bogies}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Estimated Arrival</span>
              <span>{item.estimatedArrival}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Description</span>
              <span>{item.description}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Route</span>
              <span>{item.source} to {item.destination}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Status</span>
              <span>{item.trainStatus}</span>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}