"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, api, type Hub, type Rider } from "@/lib/api";
import { Icon } from "./icon";

type Branch = { id: string; name: string; code: string; type: string; phone?: string | null; email?: string | null };
type HubRecord = Hub & { address?: string; branchId?: string | null; isActive?: boolean };
type Vehicle = { id: string; type: string; plateNumber: string; capacityKg?: string | number | null };
type HubManager = {
  id: string;
  name: string;
  email: string;
  managedHubId: string | null;
  managedHub: { id: string; name: string; code: string } | null;
};
type FormKind = "branch" | "hub" | "vehicle" | "rider" | "manager";

function messageFor(error: unknown) {
  return error instanceof ApiError ? error.message : "Request failed. Please try again.";
}

export function AdminOperations({
  canManageNetwork,
  allowAdminCreation,
}: {
  canManageNetwork: boolean;
  allowAdminCreation: boolean;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hubs, setHubs] = useState<HubRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [managers, setManagers] = useState<HubManager[]>([]);
  const [managerHubDrafts, setManagerHubDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!canManageNetwork) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [branchRows, hubRows, vehicleRows, riderRows, managerRows] = await Promise.all([
        api.get<Branch[]>("/operations/branches"),
        api.get<HubRecord[]>("/operations/hubs"),
        api.get<Vehicle[]>("/operations/vehicles"),
        api.get<Rider[]>("/operations/riders"),
        api.get<HubManager[]>("/operations/hub-managers"),
      ]);
      setBranches(branchRows);
      setHubs(hubRows);
      setVehicles(vehicleRows);
      setRiders(riderRows);
      setManagers(managerRows);
      setManagerHubDrafts(Object.fromEntries(managerRows.map((manager) => [manager.id, manager.managedHubId ?? ""])));
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, [canManageNetwork]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createResource(event: FormEvent<HTMLFormElement>, kind: FormKind) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const field = (name: string) => String(values.get(name) ?? "").trim();
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      if (kind === "branch") {
        await api.post("/operations/branches", {
          name: field("name"),
          code: field("code").toUpperCase(),
          type: field("type"),
          ...(field("phone") ? { phone: field("phone") } : {}),
          ...(field("email") ? { email: field("email") } : {}),
        });
      } else if (kind === "hub") {
        await api.post("/operations/hubs", {
          name: field("name"),
          code: field("code").toUpperCase(),
          address: field("address"),
          city: field("city"),
          ...(field("branchId") ? { branchId: field("branchId") } : {}),
        });
      } else if (kind === "vehicle") {
        const capacity = field("capacityKg");
        await api.post("/operations/vehicles", {
          type: field("type"),
          plateNumber: field("plateNumber").toUpperCase(),
          ...(capacity ? { capacityKg: Number(capacity) } : {}),
        });
      } else if (kind === "rider") {
        await api.post("/operations/riders", {
          name: field("name"),
          email: field("email"),
          password: field("password"),
          hubId: field("hubId"),
          ...(field("phone") ? { phone: field("phone") } : {}),
          ...(field("vehicleType") ? { vehicleType: field("vehicleType") } : {}),
        });
      } else {
        await api.post("/operations/hub-managers", {
          name: field("name"),
          email: field("email"),
          password: field("password"),
          hubId: field("hubId"),
        });
      }
      form.reset();
      setNotice(
        kind === "branch"
          ? "Branch created."
          : kind === "hub"
            ? "Hub created."
            : kind === "vehicle"
              ? "Vehicle added to the fleet."
              : kind === "rider"
                ? "Rider account created and assigned to the selected hub."
                : "Hub manager account created and assigned.",
      );
      await refresh();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy("");
    }
  }

  async function saveManagerHub(manager: HubManager) {
    const hubId = managerHubDrafts[manager.id];
    if (!hubId || hubId === manager.managedHubId) return;
    setBusy(manager.id);
    setError("");
    setNotice("");
    try {
      await api.patch(`/operations/hub-managers/${manager.id}/hub`, { hubId });
      setNotice(`Hub assignment updated for ${manager.name}.`);
      await refresh();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy("");
    }
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const field = (name: string) => String(values.get(name) ?? "").trim();
    setBusy("admin");
    setError("");
    setNotice("");
    try {
      await api.post("/auth/admins", {
        name: field("name"),
        email: field("email"),
        password: field("password"),
      });
      form.reset();
      setNotice("Administrator account created.");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy("");
    }
  }

  function submitButton(kind: FormKind, label: string) {
    return (
      <button className="btn btn-small" type="submit" disabled={busy === kind || loading}>
        {busy === kind ? "Saving…" : label}
        <Icon name="arrowRight" size={13} />
      </button>
    );
  }

  return (
    <div className="admin-operations">
      <div className="admin-ops-intro">
        <div>
          <h3>{canManageNetwork ? "Network setup" : "Admin accounts"}</h3>
          <p>
            {canManageNetwork
              ? "Create locations and staff, then keep their hub assignments current."
              : "Create administrator accounts for your workspace."}
          </p>
        </div>
        {canManageNetwork && (
          <button className="btn btn-light btn-small" type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>

      {error && (
        <div className="notice notice-error admin-ops-notice" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice admin-ops-notice" role="status">
          {notice}
        </div>
      )}

      <div className="admin-ops-grid">
        {canManageNetwork && <>
        <article className="panel admin-ops-card">
          <div className="admin-ops-card-head">
            <span className="metric-icon">
              <Icon name="pin" size={15} />
            </span>
            <div>
              <h3>Branches</h3>
              <p>{branches.length} active</p>
            </div>
          </div>
          <form className="form-stack admin-ops-form" onSubmit={(event) => void createResource(event, "branch")}>
            <div className="admin-ops-form-grid">
              <label className="form-label">
                Branch name
                <input className="form-input" name="name" required minLength={2} />
              </label>
              <label className="form-label">
                Branch code
                <input className="form-input" name="code" required minLength={2} maxLength={20} />
              </label>
              <label className="form-label">
                Type
                <select className="form-input" name="type" defaultValue="BRANCH">
                  <option value="BRANCH">Branch</option>
                  <option value="HUB">Hub branch</option>
                  <option value="SORTING_CENTER">Sorting center</option>
                </select>
              </label>
              <label className="form-label">
                Phone (optional)
                <input className="form-input" name="phone" inputMode="tel" />
              </label>
              <label className="form-label admin-ops-full">
                Email (optional)
                <input className="form-input" name="email" type="email" />
              </label>
            </div>
            {submitButton("branch", "Create branch")}
          </form>
          <div className="admin-ops-list">
            {branches.length ? (
              branches.map((branch) => (
                <div className="admin-ops-row" key={branch.id}>
                  <strong>{branch.name}</strong>
                  <span>
                    {branch.code} · {branch.type}
                  </span>
                </div>
              ))
            ) : (
              <p className="admin-ops-empty">{loading ? "Loading branches…" : "No branches yet."}</p>
            )}
          </div>
        </article>

        <article className="panel admin-ops-card">
          <div className="admin-ops-card-head">
            <span className="metric-icon">
              <Icon name="package" size={15} />
            </span>
            <div>
              <h3>Hubs</h3>
              <p>{hubs.length} active</p>
            </div>
          </div>
          <form className="form-stack admin-ops-form" onSubmit={(event) => void createResource(event, "hub")}>
            <div className="admin-ops-form-grid">
              <label className="form-label">
                Hub name
                <input className="form-input" name="name" required minLength={2} />
              </label>
              <label className="form-label">
                Hub code
                <input className="form-input" name="code" required minLength={2} maxLength={20} />
              </label>
              <label className="form-label">
                City
                <input className="form-input" name="city" required minLength={2} />
              </label>
              <label className="form-label">
                Branch
                <select className="form-input" name="branchId" defaultValue="">
                  <option value="">No branch link</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} · {branch.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label admin-ops-full">
                Address
                <input className="form-input" name="address" required minLength={5} />
              </label>
            </div>
            {submitButton("hub", "Create hub")}
          </form>
          <div className="admin-ops-list">
            {hubs.length ? (
              hubs.map((hub) => (
                <div className="admin-ops-row" key={hub.id}>
                  <strong>{hub.name}</strong>
                  <span>
                    {hub.code} · {hub.city || "City not set"}
                  </span>
                </div>
              ))
            ) : (
              <p className="admin-ops-empty">{loading ? "Loading hubs…" : "No hubs yet."}</p>
            )}
          </div>
        </article>

        <article className="panel admin-ops-card">
          <div className="admin-ops-card-head">
            <span className="metric-icon">
              <Icon name="truck" size={15} />
            </span>
            <div>
              <h3>Vehicles</h3>
              <p>{vehicles.length} active</p>
            </div>
          </div>
          <form className="form-stack admin-ops-form" onSubmit={(event) => void createResource(event, "vehicle")}>
            <div className="admin-ops-form-grid">
              <label className="form-label">
                Vehicle type
                <input className="form-input" name="type" required minLength={2} placeholder="Motorbike, van…" />
              </label>
              <label className="form-label">
                Plate number
                <input className="form-input" name="plateNumber" required minLength={3} />
              </label>
              <label className="form-label admin-ops-full">
                Capacity (kg, optional)
                <input className="form-input" name="capacityKg" type="number" min="0.1" step="0.1" />
              </label>
            </div>
            {submitButton("vehicle", "Add vehicle")}
          </form>
          <div className="admin-ops-list">
            {vehicles.length ? (
              vehicles.map((vehicle) => (
                <div className="admin-ops-row" key={vehicle.id}>
                  <strong>{vehicle.plateNumber}</strong>
                  <span>
                    {vehicle.type}
                    {vehicle.capacityKg ? ` · ${vehicle.capacityKg} kg` : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="admin-ops-empty">{loading ? "Loading vehicles…" : "No vehicles yet."}</p>
            )}
          </div>
        </article>

        <article className="panel admin-ops-card">
          <div className="admin-ops-card-head">
            <span className="metric-icon">
              <Icon name="user" size={15} />
            </span>
            <div>
              <h3>Riders</h3>
              <p>{riders.length} available</p>
            </div>
          </div>
          <form className="form-stack admin-ops-form" onSubmit={(event) => void createResource(event, "rider")}>
            <div className="admin-ops-form-grid">
              <label className="form-label">
                Full name
                <input className="form-input" name="name" required minLength={2} />
              </label>
              <label className="form-label">
                Email
                <input className="form-input" name="email" type="email" required />
              </label>
              <label className="form-label">
                Temporary password
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="form-label">
                Phone (optional)
                <input className="form-input" name="phone" inputMode="tel" minLength={7} maxLength={20} />
              </label>
              <label className="form-label">
                Hub
                <select className="form-input" name="hubId" required defaultValue="">
                  <option value="">Choose a hub</option>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} · {hub.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Vehicle type (optional)
                <input className="form-input" name="vehicleType" />
              </label>
            </div>
            {submitButton("rider", "Create rider")}
          </form>
          <div className="admin-ops-list">
            {riders.length ? (
              riders.map((rider) => (
                <div className="admin-ops-row" key={rider.id}>
                  <strong>{rider.user.name}</strong>
                  <span>
                    {hubs.find((hub) => hub.id === rider.hubId)?.name || "Hub not set"} ·{" "}
                    {rider.vehicleType || "No vehicle type"}
                  </span>
                </div>
              ))
            ) : (
              <p className="admin-ops-empty">{loading ? "Loading riders…" : "No available riders."}</p>
            )}
          </div>
        </article>

        <article className="panel admin-ops-card">
          <div className="admin-ops-card-head">
            <span className="metric-icon">
              <Icon name="users" size={15} />
            </span>
            <div>
              <h3>Hub managers</h3>
              <p>{managers.length} accounts</p>
            </div>
          </div>
          <form className="form-stack admin-ops-form" onSubmit={(event) => void createResource(event, "manager")}>
            <div className="admin-ops-form-grid">
              <label className="form-label">
                Full name
                <input className="form-input" name="name" required minLength={2} />
              </label>
              <label className="form-label">
                Email
                <input className="form-input" name="email" type="email" required />
              </label>
              <label className="form-label">
                Temporary password
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="form-label">
                Assigned hub
                <select className="form-input" name="hubId" required defaultValue="">
                  <option value="">Choose a hub</option>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} · {hub.code}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {submitButton("manager", "Create manager")}
          </form>
          <div className="admin-ops-list">
            {managers.length ? (
              managers.map((manager) => (
                <div className="admin-ops-manager-row" key={manager.id}>
                  <div className="admin-ops-manager-info">
                    <strong>{manager.name}</strong>
                    <span>{manager.email}</span>
                  </div>
                  <select
                    className="form-input"
                    aria-label={`Hub for ${manager.name}`}
                    value={managerHubDrafts[manager.id] ?? ""}
                    onChange={(event) =>
                      setManagerHubDrafts((drafts) => ({ ...drafts, [manager.id]: event.target.value }))
                    }
                  >
                    <option value="">Choose a hub</option>
                    {hubs.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name} · {hub.code}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-light btn-small"
                    type="button"
                    disabled={
                      !managerHubDrafts[manager.id] ||
                      managerHubDrafts[manager.id] === manager.managedHubId ||
                      busy === manager.id
                    }
                    onClick={() => void saveManagerHub(manager)}
                  >
                    {busy === manager.id ? "Saving…" : "Save hub"}
                  </button>
                </div>
              ))
            ) : (
              <p className="admin-ops-empty">{loading ? "Loading managers…" : "No hub managers yet."}</p>
            )}
          </div>
        </article>
        </>}

        {allowAdminCreation && (
          <article className="panel admin-ops-card admin-account-card">
            <div className="admin-ops-card-head">
              <span className="metric-icon">
                <Icon name="users" size={15} />
              </span>
              <div>
                <h3>Create administrator</h3>
                <p>Add an administrator account to the workspace.</p>
              </div>
            </div>
            <form className="form-stack admin-ops-form" onSubmit={(event) => void createAdmin(event)}>
              <div className="admin-ops-form-grid">
                <label className="form-label">
                  Full name
                  <input className="form-input" name="name" required minLength={2} autoComplete="name" />
                </label>
                <label className="form-label">
                  Email
                  <input className="form-input" name="email" type="email" required autoComplete="email" />
                </label>
                <label className="form-label admin-ops-full">
                  Temporary password
                  <input
                    className="form-input"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <button className="btn btn-small" type="submit" disabled={busy === "admin"}>
                {busy === "admin" ? "Creating…" : "Create administrator"}
                <Icon name="arrowRight" size={13} />
              </button>
            </form>
          </article>
        )}
      </div>
    </div>
  );
}
