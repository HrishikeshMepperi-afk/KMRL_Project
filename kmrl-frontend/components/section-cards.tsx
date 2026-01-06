import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface SectionData {
  runningTrains: number;
  maintenanceTrains: number;
  nextArrival: string;
  nextArrivalStatus: string;
  totalStaff: number;
}

export function SectionCards({ data }: { data: SectionData }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Running Trains</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.runningTrains}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              High Demand
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Increased availability <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Number of operational trains for this station
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Under Maintenance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.maintenanceTrains}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Low
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Reduced maintenance <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Trains currently unavailable
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Next Train Arrival</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.nextArrival}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {data.nextArrivalStatus}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Arriving soon <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Next scheduled train
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Staff Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.totalStaff}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Stable staffing levels <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Allocated staff for this station
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}