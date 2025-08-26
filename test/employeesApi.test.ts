import { configureStore } from "@reduxjs/toolkit";
import { employeesApi } from "../src/services/employeesApi";

// Some libs expect these in Node/JSDOM
import { TextEncoder, TextDecoder } from "util";
import dayjs from "dayjs";
import { IEmployee } from "../src/features/employees/types";
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder as any;
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder as any;

// If WHATWG Response isn't present (Node < 18), polyfill it
if (typeof (global as any).Response === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Response } = require("node-fetch");
    (global as any).Response = Response;
}

/** --------- Fixtures used by the fetch mock --------- */
let listResponse: IEmployee[] = [];
let getByIdResponse: Record<string, IEmployee | undefined> = {};

type HttpCall = { path: string; method: string; body?: any };
let callLog: HttpCall[] = [];

/** --------- Helpers for the fetch mock --------- */
function mkRes(status: number, data?: unknown, headers: Record<string, string> = {}) {
    const body = data == null ? null : JSON.stringify(data);
    return new Response(body, {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

function parseBody(body: any) {
    if (!body) return undefined;
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }
    try {
        return JSON.parse((body as any).toString());
    } catch {
        return body;
    }
}

// If fetch was called with a Request object (not just URL+init),
// read its body text and parse JSON.
async function readRequestBodyFromInput(input: RequestInfo | URL) {
    const req = input as any;
    if (req && typeof req.clone === "function" && typeof req.text === "function") {
        try {
            const txt = await req.clone().text();
            return parseBody(txt);
        } catch {
            return undefined;
        }
    }
    return undefined;
}

function normalizeFetchArgs(input: RequestInfo | URL, init?: RequestInit) {
    // href
    let href: string;
    if (typeof input === "string") href = input;
    else if (input instanceof URL) href = input.toString();
    else if (typeof (input as any).url === "string") href = (input as Request).url;
    else href = String(input);

    // method
    let method = init?.method;
    if (!method && typeof (input as any).method === "string") {
        method = (input as any).method;
    }
    method = (method ?? "GET").toUpperCase();

    const u = new URL(href, "http://localhost"); // base for relative URLs
    return { href, path: u.pathname, method };
}

/** Accept either `/employees` or `/api/v1/employee` as the "list" path */
function isListPath(path: string) {
    return path === "/employees" || path === "/api/v1/employee";
}

/** Match either `/employees/:id` or `/api/v1/employee/:id` */
function matchItemPath(path: string): string | null {
    const m =
        path.match(/^\/employees\/([^/]+)$/) ||
        path.match(/^\/api\/v1\/employee\/([^/]+)$/);
    return m ? decodeURIComponent(m[1]) : null;
}

/** --------- Install fetch mock per test --------- */
beforeEach(() => {
    listResponse = [];
    getByIdResponse = {};
    callLog = [];

    (global as any).fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const { path, method } = normalizeFetchArgs(input, init);
        // Prefer init.body, otherwise try to read from Request
        let bodyParsed = parseBody(init?.body);
        if (bodyParsed === undefined) {
            bodyParsed = await readRequestBodyFromInput(input);
        }
        callLog.push({ path, method, body: bodyParsed });

        // GET list
        if (isListPath(path) && method === "GET") {
            return mkRes(200, listResponse);
        }

        // Item paths (GET/PUT/DELETE)
        const id = matchItemPath(path);
        if (id) {
            if (method === "GET") {
                const IEmployee = getByIdResponse[id];
                return mkRes(IEmployee ? 200 : 404, IEmployee ?? { message: "Not found" });
            }
            if (method === "PUT") {
                const existing = getByIdResponse[id] as IEmployee | undefined;
                const updated: IEmployee = { ...(existing ?? { id }), ...(bodyParsed as any), id };
                getByIdResponse[id] = updated;
                listResponse = listResponse.map((r) => (r.id === id ? updated : r));
                return mkRes(200, updated);
            }
            if (method === "DELETE") {
                const existed = !!getByIdResponse[id];
                delete getByIdResponse[id];
                listResponse = listResponse.filter((r) => r.id !== id);
                return mkRes(existed ? 204 : 404, existed ? undefined : { message: "Not found" });
            }
        }

        // POST list
        if (isListPath(path) && method === "POST") {
            const created: IEmployee = { id: "new-id", ...(bodyParsed as any) };
            listResponse = [...listResponse, created];
            getByIdResponse[created.id] = created;
            return mkRes(201, created);
        }

        return mkRes(500, { message: "unhandled route in test mock", url: input, method });
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

/** --------- Store factory --------- */
function makeStore() {
    return configureStore({
        reducer: { [employeesApi.reducerPath]: employeesApi.reducer },
        middleware: (gDM) => gDM().concat(employeesApi.middleware),
    });
}

/** --------- Small path assert helpers --------- */
const expectListCall = (c: HttpCall) =>
    expect(isListPath(c.path)).toBe(true);
const expectItemCall = (c: HttpCall, id: string, method?: string) => {
    expect(matchItemPath(c.path)).toBe(id);
    if (method) expect(c.method).toBe(method);
};

/** --------- Tests --------- */
describe("employeesApi (RTK Query)", () => {
    test("getEmployees: fetches list and exposes data", async () => {
        listResponse = [
            {
                id: "1",
                first_name: "Ada",
                last_name: "Lovelace",
                email_address: "ada@example.com",
                phone_number: "91234567",
                gender: "Female",
                date_of_birth: dayjs("1990-05-12"),
                joined_date: dayjs("2020-08-01"),
            },
            {
                id: "2",
                first_name: "Alan",
                last_name: "Turing",
                email_address: "alan@example.com",
                phone_number: "92345678",
                gender: "Male",
                date_of_birth: dayjs("1985-01-03"),
                joined_date: dayjs("2010-02-04"),
            },
        ];
        getByIdResponse = Object.fromEntries(listResponse.map((r) => [r.id, r]));

        const store = makeStore();

        // keep subscription so invalidations can refetch later
        const sub = store.dispatch(employeesApi.endpoints.getEmployees.initiate(undefined));
        const res = await sub;

        // Assert via result
        expect("data" in res).toBe(true);
        expect(Array.isArray((res as any).data)).toBe(true);
        expect((res as any).data).toHaveLength(2);

        // Optionally also check the selector (now populated)
        const state = store.getState();
        const sel = employeesApi.endpoints.getEmployees.select()(state as any);
        expect(sel?.data).toEqual((res as any).data);

        // first call was GET list
        expect(callLog[0].method).toBe("GET");
        expectListCall(callLog[0]);

        sub.unsubscribe();
    });

    test("invalidate LIST tag triggers refetch of getEmployees (branch: non-empty -> empty)", async () => {
        listResponse = [
            { id: "1", first_name: "A", last_name: "L", email_address: "a@e.co", phone_number: "9", gender: "Female" } as any,
            { id: "2", first_name: "B", last_name: "T", email_address: "b@e.co", phone_number: "9", gender: "Male" } as any,
        ];
        getByIdResponse = Object.fromEntries(listResponse.map((r) => [r.id, r]));

        const store = makeStore();

        const sub = store.dispatch(employeesApi.endpoints.getEmployees.initiate(undefined));
        await sub;

        // change fixture so refetch returns empty
        listResponse = [];
        await store.dispatch(
            employeesApi.util.invalidateTags([{ type: "Employees", id: "LIST" }]) as any
        );

        // 🔑 ensure the active query finishes its refetch before asserting
        await sub.refetch();

        // Last call should be GET list (refetch)
        const last = callLog[callLog.length - 1];
        expect(last.method).toBe("GET");
        expectListCall(last);

        // selector now shows empty array
        const state = store.getState();
        const sel = employeesApi.endpoints.getEmployees.select()(state as any);
        expect(sel?.data).toEqual([]);

        sub.unsubscribe();
    });

    test("getEmployee: fetches by id", async () => {
        const IEmployee: IEmployee = {
            id: "42",
            first_name: "Grace",
            last_name: "Hopper",
            email_address: "grace@example.com",
            phone_number: "93456789",
            gender: "Female",
            date_of_birth: dayjs("1985-01-03"),
            joined_date: dayjs("2010-02-04"),
        };
        listResponse = [IEmployee];
        getByIdResponse[IEmployee.id] = IEmployee;

        const store = makeStore();
        const sub = store.dispatch(employeesApi.endpoints.getEmployee.initiate("42"));
        const res = await sub;

        expect("data" in res).toBe(true);
        expect((res as any).data.id).toBe("42");

        // First call path/method
        expect(callLog[0].method).toBe("GET");
        expectItemCall(callLog[0], "42");

        sub.unsubscribe();
    });

    test("addEmployee: POST creates IEmployee and invalidates LIST (causing list refetch)", async () => {
        const base: IEmployee = {
            id: "1",
            first_name: "Ada",
            last_name: "L",
            email_address: "a@e.co",
            phone_number: "9",
            gender: "Female",
            date_of_birth: dayjs("1985-01-03"),
            joined_date: dayjs("2010-02-04"),
        };
        listResponse = [base];
        getByIdResponse[base.id] = base;

        const store = makeStore();

        // subscribe to list so LIST invalidation triggers refetch
        const subList = store.dispatch(employeesApi.endpoints.getEmployees.initiate(undefined));
        await subList;

        // now add
        const payload = {
            first_name: "Alan",
            last_name: "Turing",
            email_address: "alan@example.com",
            phone_number: "9",
            gender: "Male" as const,
            date_of_birth: dayjs("1990-05-12"),
            joined_date: dayjs("2020-08-01"),
        };

        const addThunk = store.dispatch(
            employeesApi.endpoints.addEmployee.initiate(payload)
        );
        const created = await addThunk.unwrap();
        expect(created).toEqual(expect.objectContaining({ id: expect.any(String) }));

        // POST occurred
        expect(callLog.some((c) => isListPath(c.path) && c.method === "POST")).toBe(true);

        // 🔑 wait for the subscribed query to finish its refetch
        await subList.refetch();

        // After invalidation, last call should be GET list (refetch)
        const lastCall = callLog[callLog.length - 1];
        expect(lastCall.method).toBe("GET");
        expectListCall(lastCall);

        // selector shows 2 IEmployees
        const state = store.getState();
        const sel = employeesApi.endpoints.getEmployees.select()(state as any);
        expect(sel?.data?.length).toBe(2);

        subList.unsubscribe();
    });

    test("updateEmployee: PUT updates IEmployee and invalidates that ID (causing getEmployee(id) refetch)", async () => {
        const IEmployee: IEmployee = {
            id: "7",
            first_name: "Linus",
            last_name: "T",
            email_address: "linus@example.com",
            phone_number: "9",
            gender: "Male",
            date_of_birth: dayjs("1985-01-03"),
            joined_date: dayjs("2010-02-04"),
        };
        listResponse = [IEmployee];
        getByIdResponse[IEmployee.id] = IEmployee;

        const store = makeStore();

        // subscribe to single-entity query so ID invalidation triggers refetch
        const subOne = store.dispatch(employeesApi.endpoints.getEmployee.initiate("7"));
        await subOne;

        const patch = { first_name: "LinusX" };
        const updThunk = store.dispatch(
            employeesApi.endpoints.updateEmployee.initiate({ id: "7", ...patch } as any)
        );
        const updated = await updThunk.unwrap();
        expect(updated).toEqual(expect.objectContaining({ id: "7", first_name: "LinusX" }));

        // PUT occurred on right URL
        const hadPut = callLog.some((c) => matchItemPath(c.path) === "7" && c.method === "PUT");
        expect(hadPut).toBe(true);

        await subOne.refetch();

        // After ID invalidation, last call should be GET item
        const last = callLog[callLog.length - 1];
        expect(last.method).toBe("GET");
        expectItemCall(last, "7", "GET");

        subOne.unsubscribe();
    });

    test("deleteEmployee: DELETE removes IEmployee and invalidates LIST (causing list refetch)", async () => {
        const IEmployees: IEmployee[] = [
            { id: "1", first_name: "A", last_name: "L", email_address: "a@e.co", phone_number: "9", gender: "Female" } as any,
            { id: "2", first_name: "B", last_name: "T", email_address: "b@e.co", phone_number: "9", gender: "Male" } as any,
        ];
        listResponse = IEmployees.slice();
        getByIdResponse = Object.fromEntries(IEmployees.map((r) => [r.id, r]));

        const store = makeStore();

        const subList = store.dispatch(employeesApi.endpoints.getEmployees.initiate(undefined));
        await subList;

        const delThunk = store.dispatch(
            employeesApi.endpoints.deleteEmployee.initiate("2")
        );
        const deleted = await delThunk.unwrap();
        // RTK Query returns `null` for 204 No Content
        expect(deleted).toBeNull();

        // DELETE occurred
        const hadDel = callLog.some((c) => matchItemPath(c.path) === "2" && c.method === "DELETE");
        expect(hadDel).toBe(true);

        // 🔑 wait for the subscribed query to finish its refetch
        await subList.refetch();

        // After LIST invalidation, last call should be GET list
        const last = callLog[callLog.length - 1];
        expect(last.method).toBe("GET");
        expectListCall(last);

        const state = store.getState();
        const sel = employeesApi.endpoints.getEmployees.select()(state as any);
        expect(sel?.data?.find((r: any) => r.id === "2")).toBeUndefined();

        subList.unsubscribe();
    });
});
