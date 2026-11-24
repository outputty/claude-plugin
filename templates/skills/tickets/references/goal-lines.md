# The goal lines

Step 3 prints the first and the last of these, and the second in place of the first when several tickets were picked, with the numbers filled in. A goal line carries no turn cap.

One ticket:

/goal ticket #<n> is built by following /build <n>: its PR is open and ready for review with the docs layer last and each Implementation-criteria case's real output pasted; or a question to the user is open and not yet answered

Several tickets picked together, in the order given:

/goal tickets #<n>, #<m> are built in that order by following /build <n> <m>: each ticket's PR is open and ready for review with its docs layer last and its Implementation-criteria cases' real output pasted; or a question to the user is open and not yet answered

Every buildable ticket, built in a loop:

/goal every buildable ticket is built by following /build: each PR is open and ready for review, or merged when the merge rule allows; the goal ends when no open ticket is buildable or every one left is parked on a question
