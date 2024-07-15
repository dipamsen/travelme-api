// @ts-nocheck: HTMLElement and Node are incompatible

import { Application, Router } from "https://deno.land/x/oak@v16.1.0/mod.ts";

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.47/deno-dom-wasm.ts";

const router = new Router();

interface PNRInfo {
  pnr_number: string;
  no_of_passengers: string;
  class: string;
  train_name: string;
  train_name_h5: string;
  train_number: string;
  quota: string;
  order_id: string;
  date: string;
  journey_duration: string;
  pulse_data: PulseData;
  pax_info: Paxinfo[];
  boarding_station: BoardingStation;
  reservation_upto: ReservationUpto;
  source_station: BoardingStation;
  tip_enabled: boolean;
  tip_text: string;
  chart_prepared: boolean;
  last_updated_at: string;
  pnr_message: string;
}

interface ReservationUpto {
  arrival_time: string;
  day_count: string;
  station_code: string;
  station_name: string;
  station_name_h5: string;
}

interface BoardingStation {
  departure_time: string;
  day_count: string;
  station_code: string;
  station_name: string;
  station_name_h5: string;
}

interface Paxinfo {
  passengerSerialNumber: string;
  passengerAge: string;
  passengerBerthChoice: string;
  passengerIcardFlag: string;
  passengerNationality: string;
  fareChargedPercentage: string;
  validationFlag: string;
  bookingStatusIndex: string;
  bookingStatus: string;
  bookingCoachId: string;
  bookingBerthNo: string;
  bookingBerthCode: string;
  currentStatusIndex: string;
  currentStatus: string;
  currentBerthNo: string;
  foodChoice: string;
  psgnwlType: string;
  dropWaitlistFlag: string;
  passengerName: string;
  currentBerthCode: string;
  currentCoachId: string;
  currentStatusColor: string;
  currentStatusTextColor: string;
  currentStatusDisplayText: string;
}

interface PulseData {
  journey_src: string;
  journey_dest: string;
  is_logged_in: boolean;
  is_paytm_pnr: boolean;
  ticket_status: TicketStatus[];
  journey_date: string;
  booking_date: string;
}

interface TicketStatus {
  passenger: number;
  current_status: string;
}

router.get("/", (ctx) => {
  ctx.response.body = "Hello world";
});

router.get("/pnr/:pnr", async (ctx) => {
  const pnr = ctx.params.pnr;
  const response = await fetch(
    `https://travel.paytm.com/api/trains/v1/status?client=web&is_genuine_pnr_web_request=1&pnr_number=${pnr}`
  );

  if (response.status === 200) {
    const { body }: { body: PNRInfo } = await response.json();
    ctx.response.body = {
      pnr: body.pnr_number,
      class: body.class,
      quota: body.quota,
      trainName: body.train_name,
      trainNumber: body.train_number,
      journeyDate: body.pulse_data.journey_date,
      seats: body.pax_info.map((pax) => ({
        status: pax.currentStatus,
        seatNo: pax.currentBerthNo,
      })),
    };
  }
});

router.get("/trains", async (ctx) => {
  const response = await fetch("https://www.irctc.co.in/eticketing/trainList");
  if (response.status === 200) {
    const trains: string[] = JSON.parse("[" + (await response.text()) + "]");
    ctx.response.body = trains
      .map((train: string) => train.split(" - "))
      .map(([number, name]) => ({ number, name }));
  }
});

router.get("/stations", async (ctx) => {
  const response = await fetch(
    "https://icf.indianrailways.gov.in/PB/pass/stations.html"
  );
  if (response.status === 200) {
    const html = await response.text();
    const dom = new DOMParser().parseFromString(html, "text/html");
    const rows = dom.querySelectorAll("tr");
    const stations = Array.from(rows)
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return [
          {
            code: cells[0].textContent,
            name: cells[1].textContent,
          },
          {
            code: cells[2].textContent,
            name: cells[3].textContent,
          },
          {
            code: cells[4].textContent,
            name: cells[5].textContent,
          },
          {
            code: cells[6].textContent,
            name: cells[7].textContent,
          },
        ];
      })
      .flat();
    ctx.response.body = stations;
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({
  port: 8000,
});
