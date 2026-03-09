import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import {
  Bus,
  ArrowLeft,
  Loader2,
  Phone,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Bell as BellIcon,
  Shield,
  ChevronRight,
  MapPin,
  Navigation,
  Zap,
  Radio,
} from "lucide-react";
import { routesApi, busesApi, remindersApi } from "@/services/api";
import { socketService } from "@/services/socket";
import { useBusStore } from "@/store/busStore";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/ui/UserAvatar";
import type { Route, Stop, BusLocation, Reminder } from "@/types";

const CSS = `
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .db-root { position: fixed; inset: 0; background: #f5f7fa; overflow: hidden; font-family: inherit; }
  .db-map-bg { position: absolute; inset: 0; z-index: 0; }

  /* ── Top bar ── */
  .db-topbar {
    position: absolute; top: 0; left: 0; right: 0; z-index: 100;
    height: 60px; background: #fff;
    border-bottom: 1px solid #e8edf2;
    display: flex; align-items: center; padding: 0 16px; gap: 12px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }
  .db-topbar-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .db-topbar-logo-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 14px rgba(99,102,241,0.3); flex-shrink: 0;
  }
  .db-topbar-logo-text { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
  .db-topbar-spacer { flex: 1; }
  .db-topbar-icon-btn {
    width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0;
    background: #f8fafc; color: #475569;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: background 0.15s, color 0.15s; flex-shrink: 0;
  }
  .db-topbar-icon-btn:hover { background: #eef2ff; color: #6366f1; }
  .db-topbar-back-btn {
    width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0;
    background: #f8fafc; color: #475569;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: background 0.15s; flex-shrink: 0;
  }
  .db-topbar-back-btn:hover { background: #f1f5f9; }
  .db-topbar-subtitle { font-size: 11.5px; color: #94a3b8; margin-left: 8px; }
  .db-desk-nav { display: none; align-items: center; gap: 4px; }
  .db-desk-nav-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 10px; border: 1px solid #e2e8f0;
    background: #f8fafc; color: #475569; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .db-desk-nav-btn:hover { background: #eef2ff; border-color: #c7d2fe; color: #6366f1; }
  .db-logout-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 10px; border: 1px solid #fecaca;
    background: #fff5f5; color: #ef4444; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  }
  .db-logout-btn:hover { background: #fee2e2; }
  .db-desk-user-chip {
    display: none; align-items: center; gap: 8px;
    padding: 5px 12px 5px 6px; border-radius: 99px;
    border: 1px solid #e2e8f0; background: #f8fafc;
    cursor: pointer; transition: background 0.15s;
  }
  .db-desk-user-chip:hover { background: #eef2ff; border-color: #c7d2fe; }
  .db-desk-user-name { font-size: 13px; font-weight: 600; color: #0f172a; }

  /* ── Mobile: floating bottom sheet ── */
  .db-sheet-wrap {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 90;
    display: flex; flex-direction: column; pointer-events: none;
  }
  .db-sheet {
    pointer-events: auto;
    background: #fff;
    border-radius: 22px 22px 0 0;
    border-top: 1px solid #e8edf2;
    display: flex; flex-direction: column;
    box-shadow: 0 -8px 32px rgba(99,102,241,0.1);
    transition: max-height 0.35s cubic-bezier(0.16,1,0.3,1);
    overflow: hidden;
  }
  .db-sheet-handle-row {
    display: flex; justify-content: center; padding: 10px 0 6px; cursor: pointer; flex-shrink: 0;
  }
  .db-sheet-handle { width: 38px; height: 4px; border-radius: 99px; background: #e2e8f0; }
  .db-sheet-body { flex: 1; overflow-y: auto; padding: 0 16px 28px; min-height: 0; }

  /* ── Desktop: floating left panel ── */
  .db-panel-wrap { display: none; }

  @media (min-width: 768px) {
    .db-topbar { height: 64px; padding: 0 28px; }
    .db-topbar-logo-text { font-size: 18px; }
    .db-topbar-icon-btn { display: none; }
    .db-desk-nav { display: flex; }
    .db-desk-user-chip { display: flex; }
    /* Hide mobile sheet */
    .db-sheet-wrap { display: none; }
    /* Show desktop panel */
    .db-panel-wrap {
      display: flex; flex-direction: column;
      position: absolute; top: 80px; left: 20px; bottom: 20px; z-index: 90;
      width: 380px;
    }
    .db-panel {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
      background: #fff;
      border-radius: 20px;
      border: 1px solid #e8edf2;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1);
    }
    .db-panel-head {
      flex-shrink: 0; padding: 20px 20px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .db-panel-body { flex: 1; overflow-y: auto; padding: 0 16px 24px; min-height: 0; }
  }
  @media (min-width: 1200px) {
    .db-panel-wrap { width: 430px; left: 28px; }
    .db-topbar { padding: 0 36px; }
  }

  /* ── Panel head ── */
  .db-panel-head-row { display: flex; align-items: center; gap: 10px; }
  .db-panel-head-icon {
    width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; justify-content: center;
  }
  .db-panel-head-title { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
  .db-panel-head-sub { font-size: 11.5px; color: #94a3b8; margin-top: 1px; }
  .db-live-badge {
    margin-left: auto; display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 99px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    font-size: 11px; font-weight: 700; color: #16a34a;
  }
  .db-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px #22c55e; }

  /* ── Bus select list ── */
  .db-bus-list { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; }
  .db-bus-card {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 13px 14px; border-radius: 14px; cursor: pointer; text-align: left;
    border: 1.5px solid #e8edf2;
    background: #fff;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    position: relative; overflow: hidden;
  }
  .db-bus-card:hover { background: #eef2ff; border-color: #c7d2fe; transform: translateY(-1px); }
  .db-bus-card-live { border-left: 3px solid #6366f1; }
  .db-bus-card-inactive { opacity: 0.6; border-color: #f1f5f9; background: #fafafa; }
  .db-bus-card-icon {
    width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; justify-content: center;
  }
  .db-bus-card-icon-inactive { background: #f1f5f9; border-color: #e2e8f0; }
  .db-bus-name { font-size: 14px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 3px; }
  .db-bus-name-inactive { color: #94a3b8; }
  .db-bus-status-row { display: flex; align-items: center; gap: 5px; }
  .db-bus-pulse { position: relative; width: 8px; height: 8px; flex-shrink: 0; }
  .db-bus-pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; position: absolute; }
  .db-bus-pulse-ring { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #22c55e; position: absolute; animation: pulse-ring 1.5s ease-out infinite; }
  .db-bus-live-label { font-size: 12px; font-weight: 600; color: #16a34a; }
  .db-bus-route-badge {
    margin-left: auto; padding: 3px 10px; border-radius: 99px; flex-shrink: 0;
    font-size: 11.5px; font-weight: 600; color: #0ea5e9;
    background: #f0f9ff; border: 1px solid #bae6fd;
  }
  .db-bus-route-badge-inactive { color: #94a3b8; background: #f8fafc; border-color: #e2e8f0; }
  .db-section-label {
    font-size: 10.5px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.09em; margin: 14px 0 8px;
  }

  /* ── Empty state ── */
  .db-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 40px 0; text-align: center; animation: fade-in 0.3s ease;
  }
  .db-empty-icon {
    width: 56px; height: 56px; border-radius: 18px; margin-bottom: 14px;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; justify-content: center;
  }
  .db-empty-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .db-empty-sub { font-size: 13px; color: #94a3b8; }

  /* ── Route preview ── */
  .db-preview-head {
    border-radius: 16px; padding: 14px 16px; margin-bottom: 16px;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%);
    border: 1px solid rgba(99,102,241,0.2);
    display: flex; align-items: center; gap: 12px;
  }
  .db-preview-bus-icon {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.3);
    display: flex; align-items: center; justify-content: center;
  }
  .db-preview-bus-name { font-size: 15px; font-weight: 800; color: #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-preview-route-name { font-size: 12px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
  .db-stops-badge {
    margin-left: auto; padding: 3px 10px; border-radius: 99px; flex-shrink: 0;
    font-size: 11.5px; font-weight: 700; color: #38bdf8;
    background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.25);
  }
  .db-timeline { position: relative; margin-left: 20px; padding-bottom: 8px; }
  .db-timeline-line { position: absolute; left: 6px; top: 10px; bottom: 10px; width: 2px; background: #e2e8f0; border-radius: 2px; }
  .db-timeline-row { position: relative; padding-left: 26px; display: flex; align-items: flex-start; gap: 8px; }
  .db-timeline-dot-wrap { position: absolute; left: -1px; }
  .db-timeline-dot { border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .db-timeline-name-first { font-size: 13.5px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-timeline-name { font-size: 13px; font-weight: 500; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-timeline-name-last { font-size: 13.5px; font-weight: 700; color: #ef4444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-timeline-tag { padding: 2px 8px; border-radius: 99px; font-size: 10.5px; font-weight: 700; flex-shrink: 0; }
  .db-track-btn {
    width: 100%; margin-top: 18px; padding: 14px 0; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.01em;
    box-shadow: 0 4px 16px rgba(99,102,241,0.35); transition: opacity 0.15s, transform 0.1s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .db-track-btn:hover { opacity: 0.92; transform: translateY(-1px); }

  /* ── Active tracking ── */
  .db-driver-card {
    display: flex; align-items: center; justify-content: space-between;
    border-left: 3px solid #0ea5e9;
    background: #f0f9ff; border-radius: 0 14px 14px 0;
    padding: 12px 12px 12px 16px; margin-bottom: 14px;
    border-top: 1px solid #bae6fd; border-right: 1px solid #bae6fd; border-bottom: 1px solid #bae6fd;
  }
  .db-driver-label { font-size: 10.5px; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .db-driver-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .db-call-btn {
    display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600;
    color: #0ea5e9; text-decoration: none; background: #fff;
    padding: 7px 12px; border-radius: 10px; border: 1px solid #bae6fd;
    transition: background 0.15s;
  }
  .db-call-btn:hover { background: #e0f2fe; }
  .db-eta-card {
    border-radius: 18px; padding: 18px 20px; margin-bottom: 16px;
    background: #eef2ff; border: 1px solid #c7d2fe;
    display: flex; align-items: center; gap: 16px;
  }
  .db-eta-label { font-size: 10.5px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
  .db-eta-time { font-size: 36px; font-weight: 900; color: #4f46e5; letter-spacing: -0.04em; line-height: 1; }
  .db-eta-hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .db-speed-chip {
    margin-left: auto; text-align: center;
    background: #fff; border-radius: 14px; padding: 10px 16px;
    border: 1px solid #e2e8f0;
  }
  .db-speed-val { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
  .db-speed-unit { font-size: 10.5px; font-weight: 600; color: #94a3b8; }
  .db-stops-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }

  /* ── Stop track list ── */
  .db-stop-row { display: flex; gap: 12px; }
  .db-stop-spine { display: flex; flex-direction: column; align-items: center; width: 20px; }
  .db-stop-dot-current {
    width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; z-index: 1;
    background: #6366f1; border: 3px solid #c7d2fe;
    box-shadow: 0 0 0 3px #eef2ff;
  }
  .db-stop-dot-passed {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; z-index: 1;
    background: #22c55e; border: 2px solid #86efac;
  }
  .db-stop-dot-future {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; z-index: 1;
    background: transparent; border: 2px solid #e2e8f0;
  }
  .db-stop-line-passed { flex: 1; width: 2px; min-height: 22px; background: #22c55e; }
  .db-stop-line-future { flex: 1; width: 2px; min-height: 22px; background: #e2e8f0; }
  .db-stop-content { flex: 1; padding-bottom: 18px; }
  .db-stop-name-current { font-size: 14px; font-weight: 700; color: #6366f1; }
  .db-stop-name-passed { font-size: 13px; font-weight: 500; color: #94a3b8; }
  .db-stop-name-future { font-size: 13px; font-weight: 500; color: #0f172a; }
  .db-stop-here-tag { font-size: 11px; font-weight: 600; color: #6366f1; margin-top: 1px; }
  .db-stop-reminder-tag { font-size: 11px; color: #0ea5e9; margin-top: 2px; }
  .db-stop-eta-tag { font-size: 11px; color: #94a3b8; margin-top: 1px; }
  .db-bell-btn {
    width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: background 0.15s;
  }
  .db-bell-btn-active { background: #f0f9ff; border: 1.5px solid #bae6fd; color: #0ea5e9; }
  .db-bell-btn-idle { background: #f8fafc; border: 1.5px solid #e2e8f0; color: #94a3b8; }
  .db-reminder-popup {
    position: absolute; right: 0; top: 36px; width: 220px; z-index: 1000;
    background: #fff; border-radius: 16px; border: 1px solid #e8edf2;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12); padding: 14px;
    animation: fade-in 0.15s ease;
  }
  .db-reminder-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
  .db-reminder-sub { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }
  .db-reminder-opts { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 12px; }
  .db-reminder-opt-btn {
    padding: 7px 0; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer;
    transition: background 0.1s;
  }
  .db-reminder-opt-active { background: #6366f1; border: 1.5px solid #6366f1; color: #fff; }
  .db-reminder-opt-idle { background: #f8fafc; border: 1.5px solid #e2e8f0; color: #475569; }
  .db-reminder-save-btn {
    flex: 1; padding: 9px 0; border-radius: 10px; border: none;
    background: #6366f1; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s;
  }
  .db-reminder-remove-btn {
    flex: 1; padding: 9px 0; border-radius: 10px;
    background: #fff5f5; border: 1px solid #fecaca;
    color: #ef4444; font-size: 12px; font-weight: 700; cursor: pointer;
  }

  /* ── Sidebar drawer ── */
  .db-sidebar-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
    transition: opacity 0.3s;
  }
  .db-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; width: 285px; z-index: 201;
    background: #fff; border-right: 1px solid #e8edf2;
    box-shadow: 8px 0 40px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    transition: transform 0.3s ease-out;
  }
  .db-sidebar-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f2a4a 100%);
    padding: 52px 20px 24px; position: relative; flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .db-sidebar-close {
    position: absolute; top: 14px; right: 14px; width: 32px; height: 32px;
    border-radius: 50%; background: rgba(255,255,255,0.08); border: none;
    cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center;
  }
  .db-sidebar-name { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-top: 12px; margin-bottom: 2px; }
  .db-sidebar-email { font-size: 12.5px; color: #475569; margin-bottom: 10px; }
  .db-sidebar-role {
    display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px;
    border-radius: 99px; background: rgba(99,102,241,0.18); color: #a5b4fc;
    text-transform: capitalize;
  }
  .db-sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .db-sidebar-item {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 13px 20px; background: none; border: none; cursor: pointer;
    text-align: left; transition: background 0.12s;
  }
  .db-sidebar-item:hover { background: #f8fafc; }
  .db-sidebar-item-label { flex: 1; font-size: 14px; font-weight: 500; color: #0f172a; }
  .db-sidebar-footer { border-top: 1px solid #f1f5f9; padding: 14px; flex-shrink: 0; }
  .db-sidebar-logout {
    width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    border-radius: 12px; border: none;
    background: #fff5f5; border: 1px solid #fecaca;
    color: #ef4444; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: background 0.15s;
  }
  .db-sidebar-logout:hover { background: #fee2e2; }
  .db-sidebar-version { padding: 8px 20px 14px; font-size: 11.5px; color: #cbd5e1; }

  /* ── Loading screen ── */
  .db-loading {
    position: fixed; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    background: #f5f7fa;
  }
  .db-loading-icon {
    width: 60px; height: 60px; border-radius: 18px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 40px rgba(99,102,241,0.5);
    animation: fade-in 0.3s ease;
  }
  .db-loading-text { font-size: 14px; font-weight: 600; color: #94a3b8; }
  .animate-spin { animation: spin 1s linear infinite; }
`;

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createBusIcon(label: string, isActive = false) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:48px;height:56px;"><div style="width:48px;height:48px;background:${isActive ? "#f95f5f" : "#fbbf24"};border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:3px solid white;"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg></div><div style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;background:#38bdf8;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div></div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 48],
  });
}
const stopIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#6366f1;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(99,102,241,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type ViewState = "select" | "preview" | "tracking";
interface BusWithRoute {
  _id: string;
  plateNumber: string;
  name: string;
  capacity: number;
  isActive: boolean;
  routeId: { _id: string; name: string } | string;
  driverId?:
    | { _id: string; name: string; email: string; phone?: string }
    | string;
}

function MapController({
  center,
  zoom,
  bounds,
}: {
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBoundsExpression;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    else if (center && zoom) map.setView(center, zoom);
  }, [map, center, zoom, bounds]);
  return null;
}

export default function RiderDashboard() {
  const { busLocations, updateBusLocation, removeBus } = useBusStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("select");
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<BusWithRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusWithRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const defaultCenter: [number, number] = [31.5204, 74.3587];

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  const loadData = async () => {
    try {
      const [routesRes, busesRes] = await Promise.all([
        routesApi.getAll(true),
        busesApi.getAll({ active: true }),
      ]);
      setRoutes(routesRes.data.data);
      setBuses(busesRes.data.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.log("Geolocation not available:", err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socketService.connect(token);
    const unsubLocation = socketService.onBusLocation((data) =>
      updateBusLocation(data),
    );
    const unsubTripEnded = socketService.onTripEnded((data) =>
      removeBus(data.busId),
    );
    return () => {
      unsubLocation();
      unsubTripEnded();
    };
  }, [updateBusLocation, removeBus]);

  useEffect(() => {
    const joinAll = () => routes.forEach((r) => socketService.joinRoute(r._id));
    joinAll();
    const unsubConnected = socketService.onConnected(() => {
      joinAll();
    });
    return () => {
      routes.forEach((r) => socketService.leaveRoute(r._id));
      unsubConnected();
    };
  }, [routes]);

  const handleSelectBus = (bus: BusWithRoute) => {
    setSelectedBus(bus);
    const routeId =
      typeof bus.routeId === "object" ? bus.routeId._id : bus.routeId;
    const route = routes.find((r) => r._id === routeId);
    if (route) setSelectedRoute(route);
    setView("preview");
    setSheetExpanded(true);
  };
  const handleViewStops = () => {
    if (!selectedBus || !selectedRoute) return;
    setView("tracking");
    setSheetExpanded(true);
  };
  const handleBack = () => {
    if (view === "tracking") {
      setView("preview");
    } else if (view === "preview") {
      setView("select");
      setSelectedBus(null);
      setSelectedRoute(null);
    }
  };
  const getLiveBusLocation = (busId: string): BusLocation | undefined =>
    busLocations.get(busId);
  const getMapBounds = (): L.LatLngBoundsExpression | undefined => {
    if (view === "preview" || view === "tracking") {
      if (selectedRoute && selectedRoute.stops?.length > 0) {
        const points: [number, number][] = selectedRoute.stops.map((s) => [
          s.latitude,
          s.longitude,
        ]);
        if (selectedBus) {
          const live = getLiveBusLocation(selectedBus._id);
          if (live) points.push([live.latitude, live.longitude]);
        }
        if (userLocation) points.push(userLocation);
        return points as L.LatLngBoundsExpression;
      }
    }
    const points: [number, number][] = [];
    busLocations.forEach((loc) => points.push([loc.latitude, loc.longitude]));
    if (userLocation) points.push(userLocation);
    if (points.length >= 2) return points as L.LatLngBoundsExpression;
    return undefined;
  };
  const getRouteName = (bus: BusWithRoute): string => {
    if (typeof bus.routeId === "object" && bus.routeId) return bus.routeId.name;
    return routes.find((r) => r._id === bus.routeId)?.name || "";
  };
  const getBusLabel = (index: number): string =>
    String.fromCharCode(65 + (index % 26));
  const getDriverInfo = (
    bus: BusWithRoute,
  ): { name: string; phone?: string } | null => {
    if (typeof bus.driverId === "object" && bus.driverId)
      return { name: bus.driverId.name, phone: bus.driverId.phone };
    return null;
  };

  if (loading) {
    return (
      <div className="db-loading">
        <style>{CSS}</style>
        <div className="db-loading-icon">
          <Bus size={28} color="#fff" />
        </div>
        <Loader2 size={20} color="#6366f1" className="animate-spin" />
        <span className="db-loading-text">Loading transit data…</span>
      </div>
    );
  }

  const mapBounds = getMapBounds();
  const mapCenter = userLocation || defaultCenter;

  const mapContent = (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mapBounds && <MapController bounds={mapBounds} />}
      {!mapBounds && <MapController center={mapCenter} zoom={13} />}
      {userLocation && (
        <>
          <Circle
            center={userLocation}
            radius={100}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Your location
              </span>
            </Popup>
          </Marker>
        </>
      )}
      {(view === "preview" || view === "tracking") &&
        selectedRoute &&
        (selectedRoute.path && selectedRoute.path.length > 1 ? (
          <Polyline
            positions={selectedRoute.path}
            color="#0ea5e9"
            weight={5}
            opacity={0.9}
          />
        ) : selectedRoute.stops?.length > 1 ? (
          <Polyline
            positions={selectedRoute.stops.map(
              (s) => [s.latitude, s.longitude] as [number, number],
            )}
            color="#0ea5e9"
            weight={5}
            opacity={0.9}
          />
        ) : null)}
      {(view === "preview" || view === "tracking") &&
        selectedRoute?.stops?.map((stop) => (
          <Marker
            key={stop._id}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          >
            <Popup>
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{stop.name}</div>
                <div style={{ color: "#94a3b8" }}>
                  Stop #{stop.sequence + 1}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      {view === "select" &&
        buses.map((bus, idx) => {
          const live = getLiveBusLocation(bus._id);
          if (!live) return null;
          return (
            <Marker
              key={bus._id}
              position={[live.latitude, live.longitude]}
              icon={createBusIcon(getBusLabel(idx))}
              eventHandlers={{ click: () => handleSelectBus(bus) }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{bus.name}</div>
                  <div style={{ color: "#94a3b8" }}>{getRouteName(bus)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      {(view === "preview" || view === "tracking") &&
        selectedBus &&
        (() => {
          const live = getLiveBusLocation(selectedBus._id);
          const idx = buses.findIndex((b) => b._id === selectedBus._id);
          if (!live) return null;
          return (
            <Marker
              position={[live.latitude, live.longitude]}
              icon={createBusIcon(getBusLabel(idx >= 0 ? idx : 0), true)}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{selectedBus.name}</div>
                  {live.speed && (
                    <div style={{ color: "#94a3b8" }}>
                      {Math.round(live.speed)} km/h
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })()}
    </MapContainer>
  );

  const panelContent = (
    <>
      {view === "select" && (
        <BusSelectView
          buses={buses}
          getRouteName={getRouteName}
          getLiveBusLocation={getLiveBusLocation}
          onSelectBus={handleSelectBus}
        />
      )}
      {view === "preview" && selectedRoute && selectedBus && (
        <RoutePreviewView
          bus={selectedBus}
          route={selectedRoute}
          onViewStops={handleViewStops}
        />
      )}
      {view === "tracking" && selectedRoute && selectedBus && (
        <ActiveTrackingView
          bus={selectedBus}
          route={selectedRoute}
          getLiveBusLocation={getLiveBusLocation}
          getDriverInfo={getDriverInfo}
        />
      )}
    </>
  );

  const liveBusCount = buses.filter((b) => getLiveBusLocation(b._id)).length;

  const panelHead = (
    <div className="db-panel-head-row">
      <div className="db-panel-head-icon">
        {view === "select" ? (
          <Radio size={16} color="#6366f1" />
        ) : view === "preview" ? (
          <MapPin size={16} color="#6366f1" />
        ) : (
          <Navigation size={16} color="#6366f1" />
        )}
      </div>
      <div>
        <div className="db-panel-head-title">
          {view === "select"
            ? "Live Fleet"
            : view === "preview"
              ? "Route Preview"
              : "Live Tracking"}
        </div>
        <div className="db-panel-head-sub">
          {view === "select"
            ? `${liveBusCount} bus${liveBusCount !== 1 ? "es" : ""} active`
            : view === "preview" && selectedBus
              ? selectedBus.name
              : view === "tracking" && selectedBus
                ? selectedBus.name
                : "Safara Transit"}
        </div>
      </div>
      {view === "select" && liveBusCount > 0 && (
        <div className="db-live-badge">
          <div className="db-live-dot" />
          Live
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="db-root">
        <SidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={logout}
        />

        {/* Full-screen map */}
        <div className="db-map-bg">{mapContent}</div>

        {/* ── Top bar ── */}
        <header className="db-topbar">
          {view !== "select" ? (
            <button
              className="db-topbar-back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              className="db-topbar-icon-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}

          <div className="db-topbar-logo">
            <div className="db-topbar-logo-icon">
              <Bus size={16} color="#fff" />
            </div>
            <span className="db-topbar-logo-text">Safara</span>
          </div>

          {view !== "select" && (
            <span className="db-topbar-subtitle">
              {view === "preview" ? selectedBus?.name : "Tracking"}
            </span>
          )}

          <div className="db-topbar-spacer" />

          <nav className="db-desk-nav">
            {(
              [
                { label: "Account", path: "/account", Icon: User },
                {
                  label: "Notifications",
                  path: "/notifications",
                  Icon: BellIcon,
                },
                { label: "Settings", path: "/settings", Icon: Settings },
              ] as const
            ).map(({ label, path, Icon }) => (
              <button
                key={path}
                className="db-desk-nav-btn"
                onClick={() => navigate(path)}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
            <button className="db-logout-btn" onClick={logout}>
              <LogOut size={13} />
              Logout
            </button>
          </nav>

          <button
            className="db-desk-user-chip"
            onClick={() => navigate("/account")}
          >
            <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" />
            <span className="db-desk-user-name">
              {user?.name?.split(" ")[0] ?? "Account"}
            </span>
          </button>
        </header>

        {/* ── Mobile: floating bottom sheet ── */}
        <div className="db-sheet-wrap">
          <div
            className="db-sheet"
            style={{ maxHeight: sheetExpanded ? "62vh" : "90px" }}
          >
            <div
              className="db-sheet-handle-row"
              onClick={() => setSheetExpanded(!sheetExpanded)}
            >
              <div className="db-sheet-handle" />
            </div>
            <div className="db-sheet-body">{panelContent}</div>
          </div>
        </div>

        {/* ── Desktop: floating left panel ── */}
        <div className="db-panel-wrap">
          <div className="db-panel">
            <div className="db-panel-head">{panelHead}</div>
            <div className="db-panel-body">{panelContent}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function BusSelectView({
  buses,
  getRouteName,
  getLiveBusLocation,
  onSelectBus,
}: {
  buses: BusWithRoute[];
  getRouteName: (bus: BusWithRoute) => string;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  onSelectBus: (bus: BusWithRoute) => void;
}) {
  const liveBuses = buses.filter((b) => getLiveBusLocation(b._id));
  const inactiveBuses = buses.filter((b) => !getLiveBusLocation(b._id));

  if (buses.length === 0) {
    return (
      <div className="db-empty">
        <div className="db-empty-icon">
          <Bus size={24} color="#6366f1" />
        </div>
        <div className="db-empty-title">No buses available</div>
        <div className="db-empty-sub">Check back later for active routes</div>
      </div>
    );
  }

  return (
    <div className="db-bus-list">
      {liveBuses.length > 0 && (
        <>
          <div className="db-section-label">On-route now</div>
          {liveBuses.map((bus) => (
            <button
              key={bus._id}
              className="db-bus-card db-bus-card-live"
              onClick={() => onSelectBus(bus)}
            >
              <div className="db-bus-card-icon">
                <Bus size={18} color="#6366f1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="db-bus-name">{bus.name}</div>
                <div className="db-bus-status-row">
                  <div className="db-bus-pulse">
                    <div className="db-bus-pulse-dot" />
                    <div className="db-bus-pulse-ring" />
                  </div>
                  <span className="db-bus-live-label">Live · On route</span>
                </div>
              </div>
              {getRouteName(bus) && (
                <span className="db-bus-route-badge">{getRouteName(bus)}</span>
              )}
              <ChevronRight
                size={15}
                color="#6366f1"
                style={{ flexShrink: 0 }}
              />
            </button>
          ))}
        </>
      )}
      {inactiveBuses.length > 0 && (
        <>
          <div className="db-section-label">Inactive</div>
          {inactiveBuses.map((bus) => (
            <button
              key={bus._id}
              className="db-bus-card db-bus-card-inactive"
              onClick={() => onSelectBus(bus)}
            >
              <div className="db-bus-card-icon db-bus-card-icon-inactive">
                <Bus size={18} color="#334155" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`db-bus-name db-bus-name-inactive`}>
                  {bus.name}
                </div>
                <div style={{ fontSize: 12, color: "#334155" }}>
                  Not currently active
                </div>
              </div>
              {getRouteName(bus) && (
                <span
                  className={`db-bus-route-badge db-bus-route-badge-inactive`}
                >
                  {getRouteName(bus)}
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function RoutePreviewView({
  bus,
  route,
  onViewStops,
}: {
  bus: BusWithRoute;
  route: Route;
  onViewStops: () => void;
}) {
  const stops = route.stops || [];
  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="db-preview-head">
        <div className="db-preview-bus-icon">
          <Bus size={18} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="db-preview-bus-name">{bus.name}</div>
          <div className="db-preview-route-name">{route.name}</div>
        </div>
        <span className="db-stops-badge">{stops.length} stops</span>
      </div>

      {stops.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px 0",
            color: "#475569",
            fontSize: 13,
          }}
        >
          No stops on this route
        </div>
      ) : (
        <div className="db-timeline">
          <div className="db-timeline-line" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              const dotSize = isFirst || isLast ? 16 : 12;
              const dotStyle: React.CSSProperties = {
                width: dotSize,
                height: dotSize,
                background: isFirst ? "#fff" : isLast ? "#ef4444" : "#0ea5e9",
                border: isFirst
                  ? "3px solid #6366f1"
                  : isLast
                    ? "3px solid #ef4444"
                    : "2px solid #0ea5e9",
                boxShadow: isFirst ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
                marginLeft: isFirst || isLast ? -1 : 1,
                marginTop: isFirst || isLast ? 0 : 2,
              };
              return (
                <div key={stop._id} className="db-timeline-row">
                  <div
                    className="db-timeline-dot-wrap"
                    style={{ top: isFirst || isLast ? 4 : 6 }}
                  >
                    <div className="db-timeline-dot" style={dotStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className={
                        isFirst
                          ? "db-timeline-name-first"
                          : isLast
                            ? "db-timeline-name-last"
                            : "db-timeline-name"
                      }
                    >
                      {stop.name}
                    </div>
                    {stop.estimatedArrivalTime && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#334155",
                          marginTop: 1,
                        }}
                      >
                        {stop.estimatedArrivalTime}
                      </div>
                    )}
                  </div>
                  {isFirst && (
                    <span
                      className="db-timeline-tag"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        color: "#a5b4fc",
                      }}
                    >
                      Start
                    </span>
                  )}
                  {isLast && stops.length > 1 && (
                    <span
                      className="db-timeline-tag"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#f87171",
                      }}
                    >
                      End
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="db-track-btn" onClick={onViewStops}>
        <Zap size={15} /> Track Live
      </button>
    </div>
  );
}

function ActiveTrackingView({
  bus,
  route,
  getLiveBusLocation,
  getDriverInfo,
}: {
  bus: BusWithRoute;
  route: Route;
  getLiveBusLocation: (busId: string) => BusLocation | undefined;
  getDriverInfo: (bus: BusWithRoute) => { name: string; phone?: string } | null;
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderPopup, setReminderPopup] = useState<string | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const res = await remindersApi.getMyReminders();
      setReminders(res.data.data || []);
    } catch {}
  };

  const handleSetReminder = async (stopId: string, minutesBefore: number) => {
    setSavingReminder(true);
    try {
      const existing = reminders.find((r) => {
        const sId =
          typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
        return sId === stopId;
      });
      if (existing) {
        await remindersApi.update(existing._id, { minutesBefore });
      } else {
        await remindersApi.create({
          stopId,
          routeId: route._id,
          minutesBefore,
        });
      }
      await loadReminders();
      setReminderPopup(null);
    } catch {
    } finally {
      setSavingReminder(false);
    }
  };

  const handleRemoveReminder = async (stopId: string) => {
    try {
      const existing = reminders.find((r) => {
        const sId =
          typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
        return sId === stopId;
      });
      if (existing) {
        await remindersApi.delete(existing._id);
        await loadReminders();
        setReminderPopup(null);
      }
    } catch {}
  };

  const busLocation = getLiveBusLocation(bus._id);
  const driver = getDriverInfo(bus);
  const stops = route.stops || [];
  const routePath = route.path;
  const currentIdx = getCurrentStopIndex(stops, busLocation, routePath);
  const etaMinutes = estimateETA(stops, currentIdx);
  const etaDisplay = formatETA(etaMinutes);

  return (
    <div style={{ paddingTop: 8, paddingBottom: 20 }}>
      {driver && (
        <div className="db-driver-card">
          <div>
            <div className="db-driver-label">Driver</div>
            <div className="db-driver-name">{driver.name}</div>
          </div>
          {driver.phone && (
            <a href={`tel:${driver.phone}`} className="db-call-btn">
              <Phone size={13} />
              {driver.phone}
            </a>
          )}
        </div>
      )}

      <div className="db-eta-card">
        <div style={{ flex: 1 }}>
          <div className="db-eta-label">Estimated Arrival</div>
          <div className="db-eta-time">{etaDisplay}</div>
          <div className="db-eta-hint">
            {etaMinutes === 0 ? "Arriving now" : `~${etaMinutes} min away`}
          </div>
        </div>
        {busLocation?.speed != null && (
          <div className="db-speed-chip">
            <div className="db-speed-val">{Math.round(busLocation.speed)}</div>
            <div className="db-speed-unit">km/h</div>
          </div>
        )}
      </div>

      <div className="db-stops-label">Stops</div>
      <div>
        {stops.map((stop, index) => {
          const isCurrent = index === currentIdx;
          const isPassed = index < currentIdx;
          const reminderData = reminders.find((r) => {
            const sId =
              typeof r.stopId === "object" ? (r.stopId as Stop)._id : r.stopId;
            return sId === stop._id;
          });
          const hasReminder = !!reminderData;
          return (
            <div key={stop._id} className="db-stop-row">
              <div className="db-stop-spine">
                <div
                  className={
                    isCurrent
                      ? "db-stop-dot-current"
                      : isPassed
                        ? "db-stop-dot-passed"
                        : "db-stop-dot-future"
                  }
                />
                {index < stops.length - 1 && (
                  <div
                    className={
                      isPassed ? "db-stop-line-passed" : "db-stop-line-future"
                    }
                  />
                )}
              </div>
              <div className="db-stop-content">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      className={
                        isCurrent
                          ? "db-stop-name-current"
                          : isPassed
                            ? "db-stop-name-passed"
                            : "db-stop-name-future"
                      }
                    >
                      {stop.name}
                    </div>
                    {isCurrent && (
                      <div className="db-stop-here-tag">Bus is here</div>
                    )}
                    {hasReminder && (
                      <div className="db-stop-reminder-tag">
                        Alert {reminderData?.minutesBefore} min before
                      </div>
                    )}
                    {stop.estimatedArrivalTime && (
                      <div className="db-stop-eta-tag">
                        ETA: {stop.estimatedArrivalTime}
                      </div>
                    )}
                  </div>
                  {!isPassed && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          if (reminderPopup === stop._id)
                            setReminderPopup(null);
                          else {
                            setReminderMinutes(
                              reminderData?.minutesBefore || 5,
                            );
                            setReminderPopup(stop._id);
                          }
                        }}
                        title={hasReminder ? "Edit reminder" : "Set reminder"}
                        className={`db-bell-btn ${hasReminder ? "db-bell-btn-active" : "db-bell-btn-idle"}`}
                      >
                        <BellIcon size={14} />
                      </button>
                      {reminderPopup === stop._id && (
                        <div className="db-reminder-popup">
                          <div className="db-reminder-title">Set Alert</div>
                          <div className="db-reminder-sub">
                            Notify when bus is approaching this stop.
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#475569",
                              marginBottom: 8,
                            }}
                          >
                            Minutes before arrival
                          </div>
                          <div className="db-reminder-opts">
                            {[2, 5, 10, 15].map((m) => (
                              <button
                                key={m}
                                onClick={() => setReminderMinutes(m)}
                                className={`db-reminder-opt-btn ${reminderMinutes === m ? "db-reminder-opt-active" : "db-reminder-opt-idle"}`}
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                handleSetReminder(stop._id, reminderMinutes)
                              }
                              disabled={savingReminder}
                              className="db-reminder-save-btn"
                              style={{ opacity: savingReminder ? 0.7 : 1 }}
                            >
                              {savingReminder
                                ? "Saving..."
                                : hasReminder
                                  ? "Update"
                                  : "Set Alert"}
                            </button>
                            {hasReminder && (
                              <button
                                onClick={() => handleRemoveReminder(stop._id)}
                                className="db-reminder-remove-btn"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SidebarDrawer({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const menuItems = [
    { icon: User, label: "My Account", path: "/account" },
    { icon: BellIcon, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
    { icon: Shield, label: "Privacy Policy", path: "/privacy" },
  ];
  return (
    <>
      <div
        className="db-sidebar-overlay"
        onClick={onClose}
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="db-sidebar"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="db-sidebar-hero">
          <button className="db-sidebar-close" onClick={onClose}>
            <X size={16} />
          </button>
          <UserAvatar name={user?.name} avatar={user?.avatar} size="lg" />
          <div className="db-sidebar-name">{user?.name || "User"}</div>
          <div className="db-sidebar-email">{user?.email}</div>
          <span className="db-sidebar-role">{user?.role || "Rider"}</span>
        </div>
        <nav className="db-sidebar-nav">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              className="db-sidebar-item"
              onClick={() => {
                navigate(path);
                onClose();
              }}
            >
              <Icon size={17} color="#334155" />
              <span className="db-sidebar-item-label">{label}</span>
              <ChevronRight size={14} color="#1e293b" />
            </button>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <button
            className="db-sidebar-logout"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
        <div className="db-sidebar-version">Safara v1.0.0</div>
      </div>
    </>
  );
}

function findClosestPointIndex(
  path: [number, number][],
  pos: [number, number],
): number {
  let minDist = Infinity,
    closestIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const dist = haversineDistance(pos[0], pos[1], path[i][0], path[i][1]);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }
  return closestIdx;
}

function getCurrentStopIndex(
  stops: Stop[],
  busLocation?: BusLocation,
  routePath?: [number, number][],
): number {
  if (!busLocation || stops.length === 0) return 0;
  const busPos: [number, number] = [
    busLocation.latitude,
    busLocation.longitude,
  ];
  if (routePath && routePath.length > 1) {
    const busPathIdx = findClosestPointIndex(routePath, busPos);
    let currentStopIdx = 0;
    for (let i = 0; i < stops.length; i++) {
      const stopPathIdx = findClosestPointIndex(routePath, [
        stops[i].latitude,
        stops[i].longitude,
      ]);
      const distToStop = haversineDistance(
        busLocation.latitude,
        busLocation.longitude,
        stops[i].latitude,
        stops[i].longitude,
      );
      if (busPathIdx > stopPathIdx && distToStop > 200) {
        currentStopIdx = Math.min(i + 1, stops.length - 1);
      } else break;
    }
    return currentStopIdx;
  }
  const NEAR_THRESHOLD = 500;
  let closestIndex = 0,
    minDist = Infinity;
  stops.forEach((stop, index) => {
    const dist = haversineDistance(
      busLocation.latitude,
      busLocation.longitude,
      stop.latitude,
      stop.longitude,
    );
    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });
  if (minDist > NEAR_THRESHOLD) return 0;
  return closestIndex;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateETA(stops: Stop[], currentIndex: number): number {
  return Math.max(0, stops.length - 1 - currentIndex) * 3;
}

function formatETA(minutes: number): string {
  const hrs = Math.floor(minutes / 60),
    mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
