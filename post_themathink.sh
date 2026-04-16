#!/bin/bash
# Script to post THEMATHINK posts 2 and 3 with 1-hour delays

POST2="i spent 3 months building in public.
most days i have nothing to show.

this is the truth about building something that matters:
it looks like failure until it doesn't.

THEMATHINK is not a product yet.
it's a belief: that the age of AI makes human questioning more valuable, not less.

most people will disagree with that.
that's how i know i'm onto something."

POST3="hot take:
most people use AI to feel less alone in being wrong.

they ask AI to confirm their thinking.
to be a wall for their ideas to bounce off.

that's not intelligence.
that's outsourcing your ego.

THEMATHINK does the opposite.
it makes you uncomfortable.
it makes you wrong more often.

that's a feature."

echo "Waiting 1 hour before posting #2..."
sleep 3600

# Use openclaw to send post 2
openclaw browser open "https://x.com/compose/post"

echo "Post 2 ready to go. Please manually post or use browser tool."
echo "---POST2_START---"
echo "$POST2"
echo "---POST2_END---"

echo "Waiting 1 more hour before posting #3..."
sleep 3600

echo "Post 3 ready to go. Please manually post or use browser tool."
echo "---POST3_START---"
echo "$POST3"
echo "---POST3_END---"
