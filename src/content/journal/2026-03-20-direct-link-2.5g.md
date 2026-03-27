---
title: "Direct 2.5G link between pve1 and pve2"
date: 2026-03-20
tags: ["network", "proxmox", "infrastructure"]
summary: "Direct Ethernet cable between the two main nodes — 2.36 Gbps measured, 0.17ms latency."
---

The two main Proxmox nodes were communicating through the switch and the Freebox — at gigabit speed. I configured a direct link between pve1 and pve2 using their RTL8125B 2.5GbE NICs.

**What was done:**
- Direct Ethernet cable between secondary NICs (nic1) on pve1 and pve2
- Created `vmbr1` bridge on each node — `10.10.10.1/30` ↔ `10.10.10.2/30`
- Throughput test: **2.36 Gbps** measured with iperf3, **0.17ms** latency

This link is used for live CT migrations between nodes and backup traffic, without saturating the main LAN.
