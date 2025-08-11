# 109OZ Parking Registration

I created this app as a personal challenge after experiencing frustration with the official visitor parking registration page for 109OZ. This app uses the official site's API under the hood, proxied through a Node server I set up to bypass CORS restrictions. Any resident of 109OZ can use this tool instead of the official site. It should also work for other buildings but only supports 24 Hour registrations as that is the only type available at 109OZ.

All of the capabilities of the official site are supported in this alternative, except for the following differences:

- You cannot select a province for the vehicle. This field is optional, so I figure why make extra work?
- You must book in 24 hour increments. There's no point in fiddling with hours and minutes since the only thing that matters is 1) do you have a registration while the car is parked (longer is safer), and 2) how many reservations up to 24 hours did you take in a month (you are allowed up to 10).
- No support for "Day" or "Night" reservations since these are not offered at 109OZ.

## ADVANTAGES

This app has several advantages compared to the official app

- Can be installed as a PWA (progressive web app) for a native-like experience and application icon on your iOS or Android home screen.
- You can click "repeat" from a previous registration to automatically fill in the registration form using previous data.
- You do not need to fill in a date range to see previous registrations.
- You do not have to select "Parking For: 24 Hours" since it is the only option.
- You do not need to set the end time in hours/minutes. Just indicate how many 24 hour periods you need (default 1)
- The form does not show the name, email, and phone fields which you can't edit here anyway.
- If your vehicle make is not in the list, you do not need to click "New Make", then add it, then input it again a second time. If you input a make that is not in the list, it will be added automatically at submission time.
- Province is not required therefore not displayed. Why make extra work?
- Note: vehicle model is not required either, but I thought it might be useful to have it so you can more easily distinguish regular guests in your history.
- If you edit the plate number after filling in make or model, the data you input in those fields will not be lost.
- There are no fields that look like fields but can't be input.
- No non-functional up/down arrows on the quantity field.
- No confusing widgets for inputting time.
- It is more clear when you have submitted a successful registration (official app shows a toast notification but otherwise just clears form)
- Parking history is ordered with newest first.
- No requirement to login again after updating account information.
- No irrelevant information on screen (types of parking not offered at 109OZ).
- Any secondary buttons (like reset/cancel) are clearly subordinate and can't be confused as a primary button.
- Looks nicer. Cool logo.

## ISSUES

If your account is missing name, email, or phone, the app should send you to the Account page and not allow you to visit any other page until you complete your account. However, since my account is already complete, I was unable to test this. If your account is incomplete and you confirm this feature works, please create an Issue in GitHub to report this.

If you find any issue, please create an Issue in GitHub. Please note that the rules are loaded from the official site's API, so I cannot correct grammatical errors, wrong postal code, and other errors. Same goes for most of the messages that appear in response to actions (save/submit/etc).

## OTHER INFORMATION

The front-end app is hosted by Netlify. It also depends on an API proxy which I built using Node-RED and hosted in AWS EC2. The app could break if the original app API is altered, and the app will break if I stop hosting the API proxy.

## TO DO

- If profile is incomplete, prompt to update before registration.
