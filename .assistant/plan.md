# Plan

Goal: A journal that asks me one reflective question each evening and saves my answers.

1. The app is named in app/identity.ts as an evening journal that asks one reflective question a day, with a matching description, and the browser tab title shows that name.
2. Opening the home page directly shows today's date, tonight's question as a prominent heading, and a labelled answer form with a multiline answer box and a Save button — answering works right there with no sign-in, URL parameter or prior navigation.
3. Tonight's question is picked by calendar day from a rotating pool of at least 60 reflective questions kept in its own data module (lib/data/questions.ts), covering themes such as gratitude, relationships, work, memory and self-knowledge; reloading the page shows the same question until the date changes, and when the date changes the next question appears while the previous answer stays filed under its own day.
4. Submitting the answer form saves the entry and the form is replaced by the saved answer with an Edit button; pressing Save with an empty or whitespace-only answer shows a validation message and saves nothing; everything the app saves — each answer with its date and the question it answered, plus any custom question — is still there after reloading the page.
5. Pressing Edit reopens the answer form with the saved text in it, and saving the edit updates the answer shown on the page.
6. The home page has Tonight, Journal and Questions tabs; the Journal tab lists every answered day, newest first, each entry showing its date, the question that was asked and the full answer text.
7. Each journal entry can be edited, which opens the answer form for that day, or deleted, and deleting asks for confirmation on a button labelled Delete before the entry disappears; the deleted day then shows as unanswered again and can be answered a second time.
8. A strip in the Journal tab shows the last 7 days with answered days marked; tapping an unanswered day opens the answer form with that day's own question, and saving files the answer under that date.
9. The Journal tab shows a readout of total days journaled and the current streak in consecutive days, plus a bar chart of answers per week over the past 12 weeks; before the first answer the total reads 0 and the streak reads 0.
10. The Questions tab lists the full rotation pool, offers a labelled Add question form whose submissions join the rotation, and gives each custom question a Remove button that takes it back out.
11. A search box in the Journal tab narrows the entries to those whose question or answer contains the typed text; when nothing matches the list is replaced by a message saying so, and clearing the box brings the whole list back.
12. Pressing Share on a journal entry offers to share or save an image card of that day's question and answer, and nothing is shared unless the button is pressed.
13. The whole flow works from the keyboard: Tab reaches every control on the home page in order, and Ctrl+Enter in the answer box saves the entry.
14. At phone width the home page and Journal tab fit without horizontal scrolling, with the question, form, streak readout and entries all readable and tap targets at least 32px.

These are the outcomes this task is judged against.

Uses: charts