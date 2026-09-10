"use client";

import React, { useState } from "react";
import { useLalaFlow } from "../context/LalaFlowContext";
import { 
  Clock, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  BarChart3, 
  Award,
  PauseCircle,
  Inbox,
  Calculator
} from "lucide-react";

export const ImpactDashboard: React.FC = () => {
  const { metrics, tasks, teamMembers, bucketCounts } = useLalaFlow();

  // Interactive ROI Calculator State
  const [tasksPerDay, setTasksPerDay] = useState(metrics.settings?.tasks_per_day || 35);
  const [manualMins, setManualMins] = useState(metrics.settings?.manual_mins_per_task || 24);
  const [autoMins, setAutoMins] = useState(metrics.settings?.auto_mins_per_task || 4);
  const [workingDays, setWorkingDays] = useState(metrics.settings?.working_days_per_month || 22);

  // Live ROI Calculation
  const minsSavedPerTask = Math.max(1, manualMins - autoMins);
  const hoursSavedPerDay = Math.round(((tasksPerDay * minsSavedPerTask) / 60) * 10) / 10;
  const hoursSavedPerMonth = Math.round((hoursSavedPerDay * workingDays) * 10) / 10;
  const hoursSavedPerYear = Math.round((hoursSavedPerMonth * 12) * 10) / 10;
  const monetarySavingsMonthly = Math.round(hoursSavedPerMonth * 35); // $35/hr blended rate

  // Calculate workload per team member
  const memberWorkload = teamMembers.map((member) => {
    const assignedTasks = tasks.filter((t) => t.owner?.id === member.id);
    const completed = assignedTasks.filter((t) => t.status === "DONE").length;
    const waitingClient = assignedTasks.filter((t) => t.status === "WAITING_ON_CLIENT" || t.status === "NEEDS_CLARIFICATION").length;
    const blocked = assignedTasks.filter((t) => t.isBlocked).length;
    const active = assignedTasks.length - completed;
    return {
      member,
      total: assignedTasks.length,
      active,
      completed,
      waitingClient,
      blocked,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Top Section: Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Operational Time Saved */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-950 p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Operational Time Saved
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">
              {metrics.totalHoursSaved || metrics.hoursSaved || 58.4}
            </span>
            <span className="text-sm font-semibold text-indigo-400">hours</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">20 mins</span> saved per operational deliverable
          </p>
        </div>

        {/* KPI 2: Zero Dropped Commitments */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-950 p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Dropped Task Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-400">
              0.0%
            </span>
            <span className="text-xs font-bold text-emerald-500/90 uppercase">Zero Loss</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            100% of WhatsApp/email requests tracked in system
          </p>
        </div>

        {/* KPI 3: Speed to Accountability */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-zinc-900/60 to-zinc-950 p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Intake-to-Workflow Speed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">
              {metrics.avgTaskCreationSeconds || 4.8}
            </span>
            <span className="text-sm font-semibold text-blue-400">seconds</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Down from <span className="text-zinc-500 line-through">24 mins</span> manual spreadsheet logging
          </p>
        </div>

        {/* KPI 4: Clean SLA Compliance */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-zinc-900/60 to-zinc-950 p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Clean SLA Compliance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-purple-400">
              {metrics.completionRate || 96.4}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Client waiting times excluded from internal SLAs
          </p>
        </div>

      </div>

      {/* Manager Bucket Health Overview */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Operational Distribution by Responsibility</h3>
          </div>
          <span className="text-[11px] text-zinc-400">Ball-in-Court Distinction</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-4 space-y-1">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Waiting for Us</span>
            </span>
            <div className="text-2xl font-black text-white">{bucketCounts.waitingForUs}</div>
            <p className="text-[11px] text-zinc-400">Internal execution underway across team leads.</p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-4 space-y-1">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <PauseCircle className="h-3.5 w-3.5" />
              <span>Waiting for the Client</span>
            </span>
            <div className="text-2xl font-black text-purple-300">{bucketCounts.waitingOnClient}</div>
            <p className="text-[11px] text-purple-400/80">SLA clocks paused. Awaiting client feedback.</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              <span>Unassigned Triage Queue</span>
            </span>
            <div className="text-2xl font-black text-amber-300">{bucketCounts.unassigned}</div>
            <p className="text-[11px] text-zinc-400">Awaiting manager scoping or role dispatch.</p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 space-y-1">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>True Overdue Breaches</span>
            </span>
            <div className="text-2xl font-black text-red-400">{bucketCounts.overdue}</div>
            <p className="text-[11px] text-zinc-400">Internal work past SLA (Client waiting excluded).</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Comparison & Live Team Accountability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Before vs After Impact Analysis */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Business Impact Transformation</h3>
            </div>
            <span className="text-[11px] font-semibold text-indigo-400">Lala Tech LLC Operational Blueprint</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* The Old Way (Chaos) */}
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>BEFORE (Spreadsheets & WhatsApp)</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-zinc-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>14+ dropped requests</strong> monthly in buried WhatsApp groups.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Client-waiting tasks falsely looked <strong>overdue</strong> in employee queues.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Unassigned tasks fell through cracks without a triage funnel.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Managers spent <strong>6 hrs/week</strong> manually chasing status.</span>
                </li>
              </ul>
            </div>

            {/* The LalaFlow Way (Order) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>AFTER (LalaFlow Operational Engine)</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-zinc-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>0 dropped requests</strong>: 100% captured with clear milestone steps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Waiting on Client</strong> safely pauses SLA; never penalized.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Dedicated <strong>Unassigned Triage Queue</strong> for fast manager dispatch.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant 1-click stage progression: New ➔ Clarify ➔ Ready ➔ In Progress ➔ Done.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Live Team Accountability */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Live Team Accountability</h3>
            </div>
            <span className="text-[11px] text-zinc-500">{teamMembers.length} Team Leads</span>
          </div>

          <div className="space-y-3">
            {memberWorkload.map(({ member, total, active, completed, waitingClient, blocked }) => (
              <div key={member.id} className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 leading-none">{member.name}</p>
                      <p className="text-[10px] text-zinc-500 leading-none mt-0.5">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {waitingClient > 0 && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                        {waitingClient} on client
                      </span>
                    )}
                    {blocked > 0 && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        {blocked} blocked
                      </span>
                    )}
                    <span className="text-zinc-400 text-[11px]">
                      <strong className="text-white">{active}</strong> active / <span className="text-emerald-400 font-semibold">{completed} done</span>
                    </span>
                  </div>
                </div>

                {/* Micro progress meter */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Section: Interactive Executive ROI Calculator */}
      <div className="rounded-2xl border border-indigo-500/30 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Interactive Operational ROI Calculator</h3>
              <p className="text-[11px] text-zinc-400">Adjust parameters to forecast annual organizational savings for Lala Tech LLC</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-400">Est. Annual Value: </span>
            <span className="text-sm font-black text-white">${(monetarySavingsMonthly * 12).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Sliders Area */}
          <div className="md:col-span-7 space-y-4">
            
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Daily Client Requests Received:</span>
                <span className="font-bold text-indigo-400">{tasksPerDay} requests / day</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                value={tasksPerDay}
                onChange={(e) => setTasksPerDay(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Manual Overhead (Spreadsheets + WhatsApp chasing):</span>
                <span className="font-bold text-amber-400">{manualMins} minutes / task</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={manualMins}
                onChange={(e) => setManualMins(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">LalaFlow Automated Intake & Accountability:</span>
                <span className="font-bold text-emerald-400">{autoMins} minutes / task</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={autoMins}
                onChange={(e) => setAutoMins(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Working Days Per Month:</span>
                <span className="font-bold text-zinc-300">{workingDays} days</span>
              </div>
              <input
                type="range"
                min={15}
                max={30}
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
              />
            </div>

          </div>

          {/* Results Display */}
          <div className="md:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              Projected ROI Velocity
            </h4>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Hours Saved Daily:</span>
              <span className="text-sm font-bold text-white">{hoursSavedPerDay} hrs/day</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Hours Saved Monthly:</span>
              <span className="text-sm font-bold text-emerald-400">{hoursSavedPerMonth} hrs/mo</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Hours Saved Annually:</span>
              <span className="text-sm font-bold text-indigo-400">{hoursSavedPerYear.toLocaleString()} hrs/yr</span>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">Monthly Dollar Value:</span>
              <span className="text-base font-black text-emerald-400">${monetarySavingsMonthly.toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
