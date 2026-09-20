# `smartphone` and `tablet`, and the device maps behind them

Measured 19 September 2026, when the maintainer asked whether new models could
be added to the two maps. This file is what the mixins do today, what was
measured about the media feature they rest on, the device sizes as Xcode itself
reports them, and the decisions that come before any list is rewritten.

## What the two mixins compile to

```scss
.a { @include smartphone("iPhone11") { display: none; } }
```

```css
@media only screen and (device-width: 414px) and (device-height: 896px) and (orientation: portrait) {
  .a { display: none; }
}
```

`landscape` swaps the two, `(device-width: 896px) and (device-height: 414px)`.
`tablet` is the same mixin over `$map-for-tablets`.

## What was measured

**`device-width` still resolves in all three desktop engines.** In Chrome 152,
Firefox 156 and Safari 26.6.2, `(device-width: <screen.width>px)` matched and
the same query one pixel off did not, so the feature is not ignored, whatever
Media Queries 4 says about deprecating it. It reads the **screen**, not the
viewport: in every headless run the viewport was 1024 wide while the query
answered to 1366 or 1440.

**The landscape branch depends on the platform swapping the screen.** Emulated
in Chrome 152 at 402x874 with the device metrics protocol:

| Emulation | `(device-width: 402px) and (device-height: 874px)` portrait | swapped query, landscape | unswapped query, landscape |
|---|---|---|---|
| portrait, screen 402x874 | matches | no | no |
| landscape, screen 874x402 | no | **matches** | no |
| landscape, screen reported unswapped | no | no | **matches** |

Android Chrome reports the swapped screen, which is the second row, and that is
what the mixin writes. A platform that reports the screen unswapped, which is
what iOS Safari has always been said to do, falls in the third row, where the
mixin's landscape query matches nothing. **This was not verified on iOS.** The
simulator would not load a page in Safari without a tap to dismiss its start
page sheet, and the native simulator tooling here is blocked by an Xcode
selection the session cannot change:
`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

## The device sizes, from Xcode's own profiles

Read from `mainScreenWidth`, `mainScreenHeight` and `mainScreenScale` in
`/Library/Developer/CoreSimulator/Profiles/DeviceTypes/*.simdevicetype`, which
is the same table the simulator boots from. Points are pixels divided by the
scale, and the point size is what `device-width` answers in CSS pixels.

| Points | Devices |
|---|---|
| 320 x 568 | iPhone SE 1 |
| 375 x 667 | iPhone 6s, 7, 8, SE 2, SE 3 |
| 414 x 736 | iPhone 6s Plus, 7 Plus, 8 Plus |
| 375 x 812 | iPhone X, Xs, 11 Pro |
| 414 x 896 | iPhone Xʀ, Xs Max, 11, 11 Pro Max |
| 360 x 780 | iPhone 12 mini, 13 mini |
| 390 x 844 | iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e, 17e |
| 428 x 926 | iPhone 12 Pro Max, 13 Pro Max, 14 Plus |
| 393 x 852 | iPhone 14 Pro, 15, 15 Pro, 16 |
| 430 x 932 | iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus |
| 402 x 874 | iPhone 16 Pro, 17, 17 Pro |
| 440 x 956 | iPhone 16 Pro Max, 17 Pro Max |
| 420 x 912 | iPhone Air |
| 744 x 1133 | iPad mini 6, iPad mini A17 Pro |
| 768 x 1024 | iPad 5, iPad 6, iPad Air 2, iPad Pro 9.7, iPad mini 4, iPad mini 5 |
| 810 x 1080 | iPad 7, iPad 8, iPad 9 |
| 820 x 1180 | iPad 10, iPad A16, iPad Air 4, Air 5, Air 11-inch M2, M3, M4 |
| 834 x 1112 | iPad Air 3, iPad Pro 10.5 |
| 834 x 1194 | iPad Pro 11-inch, 1st to 4th generation |
| 834 x 1210 | iPad Pro 11-inch M4, M5 |
| 1024 x 1366 | iPad Pro 12.9-inch, all generations; iPad Air 13-inch M2, M3, M4 |
| 1032 x 1376 | iPad Pro 13-inch M4, M5 |

Nothing here was read off a marketing page; the numbers come from the profiles
on this machine, Xcode 26.4 with the iOS 26.5 runtime.

## What the maps hold today

`$map-for-smartphones` has 17 keys and stops at the iPhone 11 and the Galaxy
S10, both 2019. `$map-for-tablets` has 7 and stops at the iPad Pro and the
Nexus 10, the newest Nexus being 2013. Six generations of iPhone, the iPhone
Air, and every current iPad are missing.

Three of its numbers are worth calling out:

- `iPad: 810 x 1080` is the 7th to 9th generation, not the current iPad, which
  is 820 x 1180;
- `iPadPro: 1024 x 1366` is the 12.9-inch, so the 11-inch Pro has no entry;
- `Galaxy-S8: 360 x 740` and `Galaxy-S10: 360 x 760` are the maker's aspect
  ratios rather than the CSS sizes Chrome reports, which were never checked
  here.

## What was done, 19 September 2026

The maintainer chose names over sizes: the call stays `smartphone("iPhone17")`
and a screen size passed instead of a name is refused. Done for 4.0.0 on the
`device-maps` branch.

- Both maps are keyed by name and hold the screen as two lengths,
  `"iPhone17": 402px 874px`, instead of a map of `width` and `height`. A map
  still holding the old shape raises with a message saying so.
- Every Apple size in the table above is in, from the iPhone 12 to the 17 and
  the Air, and the current iPad, iPad Air, iPad Pro and iPad mini. `iPad` and
  `iPadPro` keep the sizes they always had, so no existing call changes: all
  72 old calls compile byte for byte as before.
- The documentation pages list the names by screen, and say plainly that
  several models share one, that the query reads the screen rather than the
  window, and that landscape depends on the platform swapping the screen.
- The Galaxy and Nexus entries are untouched. Adding Android models is still
  open: decision 3 below.

## The three decisions before a list is rewritten

1. **A name is not a size.** Seven iPhones share 390 x 844 and four share
   393 x 852, so `smartphone("iPhone15")` matches the 15 Pro and the 16 as
   well, and `smartphone("iPhone7")` already matches the 6s, the 8 and both
   SEs. Either the keys become sizes with the models listed in the
   documentation, or the API keeps promising something it cannot do.
2. **Landscape.** The swapped query is right for Android and, on what is
   written about iOS, wrong there. Until the iOS behaviour is measured, adding
   models multiplies a query that may match nothing on half the devices.
3. **Android at all.** There is no local source for Android sizes the way
   there is for Apple's, and an Android device's CSS size moves with the user's
   display size setting, so any figure taken from a spec sheet is a guess about
   a default. Either the maps carry Apple only, or the Android entries are
   marked as approximate.

   **Answered on 20 September 2026: the maps carry Android models, from
   Chrome's own list.** Not from spec sheets, and not computed: the sizes are
   the ones Chrome DevTools emulates, in
   `front_end/models/emulation/EmulatedDevices.ts`, which Google keeps per
   device. A model Chrome does not list is added only when Android Studio's
   device profile, `com/android/sdklib/devices/nexus.xml` inside `sdklib.jar`,
   gives it the same panel and density as one Chrome does; that covers the
   Pixel 6, 6a, 7a, 9a, 10 Pro and 10 Pro XL. The arithmetic alone cannot
   decide the number, which is why it is not used: a Pixel 7 is 1080px at a
   scale of 2.625, and 411.43 rounds to 411 while the device answers 412.

   Twenty entries went in: the Pixel line from the 6 to the 10, the Galaxy
   S20 Ultra, A51, A71 and A55, the Moto G Power, and the Galaxy Tab S4 among
   the tablets. Left out on purpose: folding phones, since one entry holds one
   size and a fold has two screens, and the budget A series models that lead
   the usage charts, since no source to hand gives their CSS size. The display
   size caveat stands and is written into the map, the two documentation pages
   and the caveats.

## What `todos/library-review.md` proposed instead, and the answer

Deprecating both mixins with a `@warn` naming `breakpoint`,
`container-query`, `(pointer: coarse)` and `(hover: none)`, and removing them
with the two maps.

**The maintainer decided on 20 September 2026 that they stay**, with no
deprecation and no warning. The measurements support that as far as they go:
`device-width` resolves in all three engines, the maps are current again, and
both pages say what the query does and does not do. Decision 3 below, whether the maps carry
Android models beyond the Galaxy entries they have always had, was answered on
20 September 2026: they do, from Chrome's own device list.

The case for deprecating is on the record here rather than acted on: the list
ages every September, and a name cannot be told from another of the same size.
