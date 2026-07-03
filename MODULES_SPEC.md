# Modules Spec

## Purpose

This document defines the module system for Signature Digital Immobilier.

Every client request must become one of:

- a configuration option
- a reusable module
- a refused request
- an item placed in product parking

Client requests must never become hard-coded exceptions inside the real estate engine.

## Core Principle

The engine stays common.

Agencies activate capabilities through `enabledModules`.

The UI, routes, actions, and repository access must respect module activation.

## enabledModules

```ts
enabledModules: {
  estimation: boolean,
  sellerSpace: boolean,
  agentSpace: boolean,
  ownerSpace: boolean,
  publicProperties: boolean,
  propertyDetail: boolean,
  visits: boolean,
  documents: boolean,
  offers: boolean,
  reports: boolean,
  teamPage: boolean,
  soldProperties: boolean,
  rentalPage: boolean,
  blog: boolean,
  reviews: boolean
}
```

## Module Rules

If a module is disabled:

- it is not visible in the UI
- its actions are not visible
- its direct URL is not accessible
- it must fail closed with a clean unavailable state if a route exists
- it must not expose private data

Modules must be generic and reusable.

Modules must not be tied to one agency name.

## Module Definitions

### estimation

Role:

- provides the seller estimation tunnel
- creates a request linked to `agencyId`

Visible by:

- public

Dependencies:

- requests
- agency contact/config

If disabled:

- estimation CTAs are hidden
- `/demo/[agencySlug]/estimation` is not accessible
- no estimation request can be created from the UI

### sellerSpace

Role:

- provides the seller follow-up space
- shows one seller's associated property and tracking information

Visible by:

- seller

Dependencies:

- propertyDetail
- documents when documents are enabled
- visits when visits are enabled
- reports when reports are enabled
- offers when offers are enabled

If disabled:

- seller navigation is hidden
- `/demo/[agencySlug]/vendeur` is not accessible
- seller invitations should not create visible seller access

### agentSpace

Role:

- provides the agent dashboard
- lets an agent choose a property/mandate before managing it from the property detail

Visible by:

- agent

Dependencies:

- publicProperties
- propertyDetail

If disabled:

- agent navigation is hidden
- `/demo/[agencySlug]/agent` is not accessible
- agent management actions are hidden

### ownerSpace

Role:

- provides the owner/patron dashboard
- gives agency-wide visibility
- allows agent management when supported

Visible by:

- owner

Dependencies:

- agentSpace when agent management is shown
- publicProperties
- propertyDetail

If disabled:

- owner navigation is hidden
- `/demo/[agencySlug]/patron` is not accessible
- owner-only actions are hidden

### publicProperties

Role:

- shows public property cards on the public agency page
- lets public visitors open a property detail page

Visible by:

- public
- seller
- agent
- owner

Dependencies:

- propertyDetail

If disabled:

- public property cards are hidden
- property list sections are hidden
- public visitors cannot browse properties

### propertyDetail

Role:

- provides the shared property detail page
- adapts display and actions by role

Visible by:

- public
- seller
- agent
- owner

Dependencies:

- publicProperties for public discovery
- role/session logic for private views

If disabled:

- `/demo/[agencySlug]/bien/[propertyId]` is not accessible
- property cards must not link to a disabled detail route

Permanent rule:

- the property detail remains the center of the system
- there is one shared property detail page
- it adapts by role
- it is never duplicated by agency or role

### visits

Role:

- stores and displays property visits
- lets agent/owner program visits where allowed

Visible by:

- seller for their property visits
- agent for managed properties
- owner for agency properties

Dependencies:

- propertyDetail
- sellerSpace when seller view displays visits

If disabled:

- visit sections are hidden
- add visit actions are hidden
- direct visit anchors/routes are not accessible

### documents

Role:

- stores and displays property documents
- lets agent/owner add documents where allowed
- lets seller open documents for their property

Visible by:

- seller
- agent
- owner

Dependencies:

- propertyDetail
- sellerSpace when seller view displays documents

If disabled:

- document sections are hidden
- add document actions are hidden
- document links/actions are hidden

Document rule:

- if `document.url` exists, show an open/download action
- if `document.url` is absent, show `Document en attente`
- never show broken document links

### offers

Role:

- stores and displays property offers

Visible by:

- seller for their property offers
- agent for managed properties
- owner for agency properties

Dependencies:

- propertyDetail
- sellerSpace when seller view displays offers

If disabled:

- offer sections are hidden
- add offer actions are hidden if they exist
- offers are not visible to public

### reports

Role:

- stores and displays visit feedback and seller follow-up reports

Visible by:

- seller for their property reports
- agent for managed properties
- owner for agency properties

Dependencies:

- propertyDetail
- visits when reports are linked to visits

If disabled:

- report sections are hidden
- add report actions are hidden
- reports are not visible to public

### teamPage

Role:

- displays agency team content publicly if enabled

Visible by:

- public

Dependencies:

- agency content config

If disabled:

- team sections and links are hidden
- no direct team page is accessible

### soldProperties

Role:

- displays sold property references

Visible by:

- public

Dependencies:

- publicProperties
- agency content/data config

If disabled:

- sold property sections are hidden
- no sold property route is accessible

### rentalPage

Role:

- displays rental content if the agency has a rental offer

Visible by:

- public

Dependencies:

- agency data/content config

If disabled:

- rental navigation and routes are hidden

### blog

Role:

- displays editorial articles or advice content

Visible by:

- public

Dependencies:

- content config

If disabled:

- blog links and routes are hidden
- no article route is accessible

### reviews

Role:

- displays testimonials or review content

Visible by:

- public

Dependencies:

- content config

If disabled:

- review sections are hidden

## Role Rules

Public:

- never sees internal tools
- never sees private documents
- never sees reports, internal visits, offers, or seller progress
- never sees edit controls

Seller:

- sees only their associated property
- sees enabled follow-up modules for that property
- never sees agent/owner tools
- never sees edit controls

Agent:

- sees agent dashboard when enabled
- manages property actions from the property detail
- cannot manage agents

Owner:

- sees owner dashboard when enabled
- can see global agency data
- can manage agents when the related capability exists

## Property Detail Rules

The property detail remains the center of the system.

Management actions stay in the property detail.

Actions must not be scattered in the agent dashboard.

The edit pencil is visible only to:

- agent
- owner

The edit pencil is never visible to:

- public
- seller

## Media And Document Rules

Photos are always shown in a premium horizontal carousel.

Forbidden:

- vertical photo stacks
- repeated photo sections
- ugly grids

Documents must be openable or show `Document en attente`.

Broken download buttons are forbidden.

## Definition of Done

A module change is complete only when:

- it is controlled through `enabledModules`
- disabled modules are hidden from UI
- disabled modules are not directly accessible by URL
- public users cannot see private/internal data
- sellers cannot see management tools
- agents cannot manage agents
- owners retain agency-wide capabilities
- property detail remains the central management surface
- photos remain horizontal carousels
- documents are openable or cleanly pending
- no agency-specific exception is added to the engine
- new client requests are handled as config, reusable module, refusal, or product parking
