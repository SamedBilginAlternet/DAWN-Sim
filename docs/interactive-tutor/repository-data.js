window.DAWN_TUTOR_DATA = {
  "files": [
    {
      "file": "source/config.py",
      "kind": "Config",
      "group": "Configuration",
      "lines": [
        "# network properties",
        "BROADCAST_ADDR = -1",
        "",
        "",
        "# simulation properties",
        "SIM_MESSAGGING_DELAY_TYPE = 'prop'  # could be 'prop', 'random', or 'constant'",
        "SIM_MESSAGGING_CONSTANT_DELAY = 1  # if the delay type is constant, it will be used as delay",
        "SIM_MOVE_STEP_TIME = 0.1  # step time of moving",
        ""
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "source/DawnSim.py",
      "kind": "Core",
      "group": "Simulator infrastructure",
      "lines": [
        "\"\"\"Simulator library for MANETs.",
        "Based on wsnsimpy library.",
        "Author: Mustafa Tosun",
        "\"\"\"",
        "",
        "import bisect",
        "import inspect",
        "import random",
        "import simpy",
        "from simpy.util import start_delayed",
        "from source import config",
        "",
        "BROADCAST_ADDR = config.BROADCAST_ADDR",
        "\"\"\"double: Keeps broadcast address.",
        "\"\"\"",
        "",
        "",
        "###########################################################",
        "def ensure_generator(env, func, *args, **kwargs):",
        "    \"\"\"",
        "    Make sure that func is a generator function.  If it is not, return a",
        "    generator wrapper",
        "    \"\"\"",
        "    if inspect.isgeneratorfunction(func):",
        "        return func(*args, **kwargs)",
        "    else:",
        "        def _wrapper():",
        "            func(*args, **kwargs)",
        "            yield env.timeout(0)",
        "",
        "        return _wrapper()",
        "",
        "",
        "###########################################################",
        "def distance(pos1, pos2):",
        "    \"\"\"Calculates the distance between two positions.",
        "",
        "       Args:",
        "           pos1 (Tuple(double,double)): First position.",
        "           pos2 (Tuple(double,double)): Second position.",
        "",
        "       Returns:",
        "           double: returns the distance between two positions.",
        "    \"\"\"",
        "    return ((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2) ** 0.5",
        "",
        "",
        "###########################################################",
        "class BaseNode:",
        "    \"\"\"Class to model a network node with basic operations. It's base class for more complex node classes.",
        "",
        "       Attributes:",
        "           pos (Tuple(double,double)): Position of node.",
        "           tx_range (double): Transmission range of node.",
        "           sim (Simulator): Simulation environment of node.",
        "           id (int): Global unique ID of node.",
        "           timers (List of Timer): Keeps timers set by node",
        "           is_sleeping (bool): If it is True, It means node is sleeping and can not receive messages.",
        "           Otherwise, node is awaken.",
        "           logging (bool): It is a flag for logging. If it is True, nodes outputs can be seen in terminal.",
        "           neighbor_distance_list (List of Tuple(double,Node)): Sorted list of nodes distances to other nodes.",
        "            Each Tuple keeps a distance and a node id.",
        "           timeout (Function): timeout function",
        "",
        "    \"\"\"",
        "",
        "    ############################",
        "    def __init__(self, sim, id, pos, tx_range):",
        "        \"\"\"Constructor for base Node class.",
        "",
        "           Args:",
        "               sim (Simulator): Simulation environment of node.",
        "               id (int): Global unique ID of node.",
        "               pos (Tuple(double,double)): Position of node.",
        "               tx_range (double): Transmission range of node.",
        "",
        "           Returns:",
        "               Node: Created node object.",
        "        \"\"\"",
        "        self.pos = pos",
        "        self.tx_range = tx_range",
        "        self.sim = sim",
        "        self.id = id",
        "        self.timers = []",
        "        self.is_sleeping = False",
        "        self.logging = True",
        "        self.neighbor_distance_list = []",
        "        self.timeout = self.sim.timeout",
        "",
        "    ############################",
        "    def __repr__(self):",
        "        \"\"\"Representation method of Node.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "               string: represents Node object as a string.",
        "        \"\"\"",
        "        return '<Node %d:(%.2f,%.2f)>' % (self.id, self.pos[0], self.pos[1])",
        "",
        "    ###################",
        "    def __lt__(self, other):",
        "        \"\"\"Compares the object wth other object.",
        "",
        "           Args:",
        "               other(BaseNode): the other object to compare",
        "",
        "           Returns:",
        "               bool: returns True if the object's id is less than the other object's id.",
        "        \"\"\"",
        "        if self.id < other.id:",
        "            return True",
        "        else:",
        "            return False",
        "",
        "    ############################",
        "    @property",
        "    def now(self):",
        "        \"\"\"Property for time of simulation.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "               double: Time of simulation.",
        "        \"\"\"",
        "        return self.sim.env.now",
        "",
        "    ############################",
        "    def log(self, msg):",
        "        \"\"\"Writes outputs of node to terminal.",
        "",
        "           Args:",
        "                msg (string): Output text",
        "           Returns:",
        "",
        "        \"\"\"",
        "        if self.logging:",
        "            print(f\"Node {'#' + str(self.id):4}[{self.now:10.5f}] {msg}\")",
        "",
        "    ############################",
        "    def send(self, dest, pck):",
        "        \"\"\"Sends given package. If dest address is broadcast address, it sends the package to all neighbors.",
        "",
        "           Args:",
        "                pck (Dict): Package to be sent. It should contain 'dest' which is destination address.",
        "                dest (int): Destination address (node id)",
        "           Returns:",
        "",
        "        \"\"\"",
        "        for (dist, node) in self.neighbor_distance_list:",
        "            if dist <= self.tx_range:",
        "                if dest == BROADCAST_ADDR or dest == node.id:",
        "                    if config.SIM_MESSAGGING_DELAY_TYPE == 'prop':",
        "                        prop_time = dist / 3000000",
        "                    elif config.SIM_MESSAGGING_DELAY_TYPE == 'random':",
        "                        prop_time = random.random()",
        "                    else:",
        "                        prop_time = config.SIM_MESSAGGING_CONSTANT_DELAY",
        "                    self.delayed_exec(prop_time, node.on_receive_check, pck)",
        "            else:",
        "                break",
        "",
        "    ############################",
        "    def set_timer(self, delay, callback, *args, **kwargs):",
        "        \"\"\"Sets a timer with a given name. It appends name of timer to the active timer list.",
        "",
        "           Args:",
        "                delay (double): Duration of timer.",
        "                callback (function): callback function of timer.",
        "                *args (string): Additional args.",
        "                **kwargs (string): Additional key word args.",
        "           Returns:",
        "               timer: A Timer object",
        "",
        "        \"\"\"",
        "        timer = Timer(self.sim.env, delay, callback, *args, **kwargs)",
        "        self.timers.append(timer)",
        "        return timer",
        "",
        "    ############################",
        "    def kill_all_timers(self):",
        "        \"\"\"Kills node's all timers.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "",
        "        \"\"\"",
        "        for timer in self.timers:",
        "            timer.kill()",
        "",
        "    ############################",
        "    def delayed_exec(self, delay, func, *args, **kwargs):",
        "        \"\"\"Executes a function with given parameters after a given delay.",
        "",
        "           Args:",
        "                delay (double): Delay duration.",
        "                func (Function): Function to execute.",
        "                *args (double): Function args.",
        "                delay (double): Function key word args.",
        "           Returns:",
        "",
        "        \"\"\"",
        "        return self.sim.delayed_exec(delay, func, *args, **kwargs)",
        "",
        "    ############################",
        "    def init(self):",
        "        \"\"\"Initialize a node. It is executed at the beginning of simulation. It should be overridden if needed.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        pass",
        "",
        "    ############################",
        "    def run(self):",
        "        \"\"\"Run method of a node. It is executed after init() at the beginning of simulation.",
        "        It should be overridden if needed.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        pass",
        "",
        "    ###################",
        "    def move_step(self):",
        "        \"\"\"Moves one step from the current position towards target position",
        "",
        "           Args:",
        ".",
        "           Returns:",
        "         \"\"\"",
        "        step_size = config.SIM_MOVE_STEP_TIME * self.speed",
        "        if distance(self.pos, self.target_pos) <= step_size:",
        "            self.pos = self.target_pos",
        "        else:",
        "            target_ratio = step_size / distance(self.pos, self.target_pos)",
        "            self.pos = (self.pos[0] + (self.target_pos[0] - self.pos[0]) * target_ratio,",
        "                        self.pos[1] + (self.target_pos[1] - self.pos[1]) * target_ratio)",
        "        self.sim.update_neighbor_list(self.id)",
        "        if self.pos != self.target_pos:",
        "            self.delayed_exec(config.SIM_MOVE_STEP_TIME, self.move_step)",
        "",
        "    ###################",
        "    def move(self, target_pos, speed):",
        "        \"\"\"Changes the target position to given position",
        "",
        "           Args:",
        "               target_pos (tuple of double): target position.",
        "               speed (double): speed",
        ".",
        "           Returns:",
        "         \"\"\"",
        "        self.target_pos = target_pos",
        "        self.speed = speed",
        "        self.delayed_exec(config.SIM_MOVE_STEP_TIME, self.move_step)",
        "",
        "    ############################",
        "    def on_receive(self, pck):",
        "        \"\"\"It is executed when node receives a package. It should be overridden if needed.",
        "",
        "           Args:",
        "                pck (Dict): Package received",
        "           Returns:",
        "",
        "        \"\"\"",
        "        pass",
        "",
        "    ############################",
        "    def on_receive_check(self, pck):",
        "        \"\"\"Checks if node is sleeping or not for incoming package.",
        "        If sleeping, does not call on_recieve() and does not receive package.",
        "",
        "           Args:",
        "                pck (Dict): Incoming package",
        "           Returns:",
        "",
        "        \"\"\"",
        "        if not self.is_sleeping:",
        "            self.on_receive(pck)",
        "",
        "    ############################",
        "    def sleep(self):",
        "        \"\"\"Make node sleep. In sleeping node can not receive packages.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        self.is_sleeping = True",
        "",
        "    ############################",
        "    def wake_up(self):",
        "        \"\"\"Wake node up to receive incoming messages.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        self.is_sleeping = False",
        "",
        "    ############################",
        "    def finish(self):",
        "        \"\"\"It is executed at the end of simulation. It should be overridden if needed.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        pass",
        "",
        "",
        "###########################################################",
        "class Timer(object):",
        "    \"\"\"",
        "    Class to model timers.",
        "    \"\"\"",
        "",
        "    def __init__(self, env, delay, callback, *args, **kwargs):",
        "        self.env = env",
        "        self.delay = delay",
        "        self.action = None",
        "        self.callback = callback",
        "        self.args = args",
        "        self.kwargs = kwargs",
        "        self.canceled = False",
        "        self.set()",
        "",
        "    def run(self):",
        "        \"\"\"",
        "        Calls a callback after time has elapsed.",
        "        \"\"\"",
        "        try:",
        "            yield self.env.timeout(self.delay)",
        "            self.callback(*self.args, **self.kwargs)",
        "        except simpy.Interrupt as i:",
        "            self.canceled = True",
        "",
        "    def set(self):",
        "        \"\"\"",
        "        Starts the timer",
        "        \"\"\"",
        "        if not self.action:",
        "            self.action = self.env.process(self.run())",
        "",
        "    def kill(self):",
        "        \"\"\"",
        "        Kills the timer",
        "        \"\"\"",
        "        if self.action:",
        "            self.action.interrupt()",
        "            self.action = None",
        "",
        "    def reset(self):",
        "        \"\"\"",
        "        Interrupts the current timer and restarts.",
        "        \"\"\"",
        "        self.kill()",
        "        self.set()",
        "",
        "",
        "###########################################################",
        "class Simulator:",
        "    \"\"\"Class to model a network.",
        "",
        "       Attributes:",
        "           env (simpy.rt.RealtimeEnvironment): Environment object in simpy",
        "           timescale (double): Seconds in real time for 1 second in simulation. It arranges speed of simulation",
        "           nodes (List of Node): Nodes in network.",
        "           duration (double): Duration of simulation.",
        "           random (Random): Random object to use.",
        "           timeout (Function): Timeout Function.",
        "",
        "    \"\"\"",
        "",
        "    ############################",
        "    def __init__(self, duration, timescale=1, seed=0):",
        "        \"\"\"Constructor for Simulator class.",
        "",
        "           Args:",
        "               until (double): Duration of simulation.",
        "               timescale (double): Seconds in real time for 1 second in simulation. It arranges speed of simulation",
        "               seed (double): seed for Random bbject.",
        "",
        "           Returns:",
        "               Simulator: Created Simulator object.",
        "        \"\"\"",
        "        self.env = simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)",
        "        self.nodes = []",
        "        self.duration = duration",
        "        self.timescale = timescale",
        "        self.random = random.Random(seed)",
        "        self.timeout = self.env.timeout",
        "",
        "    ############################",
        "    @property",
        "    def now(self):",
        "        \"\"\"Property for time of simulation.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "               double: Time of simulation.",
        "        \"\"\"",
        "        return self.env.now",
        "",
        "    ############################",
        "    def delayed_exec(self, delay, func, *args, **kwargs):",
        "        \"\"\"Executes a function with given parameters after a given delay.",
        "",
        "           Args:",
        "                delay (double): Delay duration.",
        "                func (Function): Function to execute.",
        "                *args (double): Function args.",
        "                delay (double): Function key word args.",
        "           Returns:",
        "",
        "        \"\"\"",
        "        func = ensure_generator(self.env, func, *args, **kwargs)",
        "        start_delayed(self.env, func, delay=delay)",
        "",
        "    ############################",
        "    def add_node(self, node_class, pos, tx_range):",
        "        \"\"\"Adds a new node in to network.",
        "",
        "           Args:",
        "                nodeclass (Class): Node class inherited from Node.",
        "                pos (Tuple(double,double)): Position of node.",
        "           Returns:",
        "                nodeclass object: Created nodeclass object",
        "        \"\"\"",
        "        id = len(self.nodes)",
        "        node = node_class(self, id, pos, tx_range)",
        "        self.nodes.append(node)",
        "        self.update_neighbor_list(id)",
        "        return node",
        "",
        "    ############################",
        "    def update_neighbor_list(self, id):",
        "        '''",
        "        Maintain each node's neighbor list by sorted distance after affected",
        "        by addition or relocation of node with ID id",
        "",
        "        Args:",
        "            id (int): Global unique id of node",
        "        Returns:",
        "",
        "        '''",
        "        me = self.nodes[id]",
        "",
        "        # (re)sort other nodes' neighbor lists by distance",
        "        for n in self.nodes:",
        "            # skip this node",
        "            if n is me:",
        "                continue",
        "",
        "            nlist = n.neighbor_distance_list",
        "",
        "            # remove this node from other nodes' neighbor lists",
        "            for i, (dist, neighbor) in enumerate(nlist):",
        "                if neighbor is me:",
        "                    del nlist[i]",
        "                    break",
        "",
        "            # then insert it while maintaining sort order by distance",
        "            bisect.insort(nlist, (distance(n.pos, me.pos), me))",
        "",
        "        self.nodes[id].neighbor_distance_list = [",
        "            (distance(n.pos, me.pos), n)",
        "            for n in self.nodes if n is not me",
        "        ]",
        "        self.nodes[id].neighbor_distance_list.sort()",
        "",
        "    ############################",
        "    def run(self):",
        "        \"\"\"Runs the simulation. It initialize every node, then executes each nodes run function.",
        "        Finally calls finish functions of nodes.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        for n in self.nodes:",
        "            n.init()",
        "        for n in self.nodes:",
        "            self.env.process(ensure_generator(self.env, n.run))",
        "        self.env.run(until=self.duration)",
        "        for n in self.nodes:",
        "            n.finish()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "source/DawnSimVis.py",
      "kind": "Visualization",
      "group": "Visualization adapter",
      "lines": [
        "\"\"\"Visualisation of wsnsimpy library. Based on wsnsimpy_tk.",
        "\"\"\"",
        "from source import DawnSim",
        "from source.DawnSim import *",
        "from threading import Thread",
        "from topovis import Scene",
        "from topovis.TkPlotter import Plotter",
        "",
        "",
        "class BaseNode(DawnSim.BaseNode):",
        "    \"\"\"Class to model a visualised network node inherited DawnSim.Node.",
        "",
        "       Attributes:",
        "           scene (Scene): Scene object to visualise",
        "",
        "    \"\"\"",
        "",
        "    ###################",
        "    def __init__(self, sim, id, pos, tx_range):",
        "        \"\"\"Constructor for visualised Node class. Creates a node in topovis scene.",
        "",
        "           Args:",
        "               sim (Simulator): Simulation environment of node.",
        "               id (int): Global unique ID of node.",
        "               pos (Tuple(double,double)): Position of node.",
        "               tx_range (double): Transmission range of node.",
        "",
        "           Returns:",
        "               BaseNode: Created node object.",
        "        \"\"\"",
        "        super().__init__(sim, id, pos, tx_range)",
        "        self.scene = self.sim.scene",
        "        self.scene.node(id, *pos)",
        "",
        "    ###################",
        "    def send(self, dest, pck):",
        "        \"\"\"Visualise sending process in addition to base send method.",
        "",
        "           Args:",
        "                pck (Dict): Package to be sent.",
        "                dest (int): Destination address (node id)",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        obj_id = self.scene.circle(",
        "            self.pos[0], self.pos[1],",
        "            self.tx_range,",
        "            line=\"wsnsimpy:tx\")",
        "        super().send(dest, pck)",
        "        self.delayed_exec(0.2, self.scene.delshape, obj_id)",
        "",
        "        if not dest == DawnSim.BROADCAST_ADDR:",
        "            destPos = self.sim.nodes[dest].pos",
        "            if distance(self.pos, destPos) <= self.tx_range:",
        "                obj_id = self.scene.line(",
        "                    self.pos[0], self.pos[1],",
        "                    destPos[0], destPos[1],",
        "                    line=\"wsnsimpy:unicast\")",
        "                self.delayed_exec(0.2,self.scene.delshape,obj_id)",
        "",
        "    ###################",
        "    def move_step(self):",
        "        \"\"\"Visualise move process in addition to base move method.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        super().move_step()",
        "        self.scene.nodemove(self.id, self.pos[0], self.pos[1])",
        "",
        "    ###################",
        "    def sleep(self):",
        "        \"\"\"Make invisible.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        for (dist, node) in self.neighbor_distance_list:",
        "            if dist <= self.tx_range:",
        "                self.scene.dellink(self.id, node.id, \"edge\")",
        "            else:",
        "                break",
        "        self.change_color(0.9411, 0.9411, 0.9411)",
        "        super().sleep()",
        "",
        "    ###################",
        "    def change_color(self, r, g, b):",
        "        \"\"\"Change node's color.",
        "",
        "           Args:",
        "               r (double): red value between 0 and 1",
        "               g (double): green value between 0 and 1",
        "               b (double): blue value between 0 and 1",
        "",
        "           Returns:",
        "",
        "        \"\"\"",
        "        self.scene.nodecolor(self.id, r, g, b)",
        "",
        "",
        "###########################################################",
        "class _FakeScene:",
        "    def _fake_method(self, *args, **kwargs):",
        "        pass",
        "",
        "    def __getattr__(self, name):",
        "        return self._fake_method",
        "",
        "",
        "###########################################################",
        "",
        "",
        "###########################################################",
        "class Simulator(DawnSim.Simulator):",
        "    '''Wrap WsnSimPy's Simulator class so that Tk main loop can be started in the",
        "    main thread",
        "",
        "    Attributes:",
        "        visual (bool): A flag to visualising process.",
        "        terrain_size (Tuple(double,double)): Size of visualised terrain.",
        "    '''",
        "",
        "    def __init__(self, duration, timescale=1, seed=0, terrain_size=(650, 650), visual=True, title=None):",
        "        \"\"\"Constructor for visualised Simulator class.",
        "",
        "           Args:",
        "               duration (double): Duration of simulation.",
        "               timescale (double): Seconds in real time for 1 second in simulation. It arranges speed of simulation",
        "               seed (double): seed for Random bbject.",
        "               terrain_size (Tuple(double,double)): Size of visualised terrain.",
        "               visual (bool): A flag to visualising process.",
        "               title (string): Title of scene.",
        "",
        "           Returns:",
        "               Simulator: Created Simulator object.",
        "        \"\"\"",
        "        super().__init__(duration, timescale, seed)",
        "        self.visual = visual",
        "        self.terrain_size = terrain_size",
        "        if self.visual:",
        "            self.scene = Scene(realtime=True)",
        "            self.scene.linestyle(\"wsnsimpy:tx\", color=(0, 0, 1), dash=(5, 5))",
        "            self.scene.linestyle(\"wsnsimpy:ack\", color=(0, 1, 1), dash=(5, 5))",
        "            self.scene.linestyle(\"wsnsimpy:unicast\", color=(0, 0, 1), width=3, arrow='head')",
        "            self.scene.linestyle(\"wsnsimpy:collision\", color=(1, 0, 0), width=3)",
        "            self.scene.linestyle(\"prev\", color=(0,.8,0), arrow=\"tail\", width=2)",
        "            self.scene.linestyle(\"edge\", color=(.7,.7,.7), width=1)",
        "            if title is None:",
        "                title = \"WsnSimPy\"",
        "            self.tkplot = Plotter(windowTitle=title, terrain_size=terrain_size)",
        "            self.tk = self.tkplot.tk",
        "            self.scene.addPlotter(self.tkplot)",
        "            self.scene.init(*terrain_size)",
        "        else:",
        "            self.scene = _FakeScene()",
        "",
        "    def _update_time(self):",
        "        \"\"\"Updates time in scene.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "        \"\"\"",
        "        while True:",
        "            self.scene.setTime(self.now)",
        "            yield self.timeout(0.1)",
        "",
        "    def update_neighbor_list(self, id):",
        "        \"\"\"Updates edges in scene.",
        "",
        "           Args:",
        "               id (int): Global unique id of node",
        "           Returns:",
        "        \"\"\"",
        "        node1 = self.nodes[id]",
        "        for (dist, node2) in node1.neighbor_distance_list:",
        "            if dist <= node1.tx_range:",
        "                try:",
        "                   self.scene.dellink(id, node2.id, \"edge\")",
        "                except:",
        "                    pass",
        "            else:",
        "                break",
        "        super().update_neighbor_list(id)",
        "        for (dist, node2) in node1.neighbor_distance_list:",
        "            if dist <= node1.tx_range:",
        "                self.scene.addlink(id, node2.id, \"edge\")",
        "            else:",
        "                break",
        "",
        "",
        "    def run(self):",
        "        \"\"\"Starts visualisation process. Puts base run method to a Thread so that visualisation become main process.",
        "",
        "           Args:",
        "",
        "           Returns:",
        "        \"\"\"",
        "        if self.visual:",
        "            self.env.process(self._update_time())",
        "            thr = Thread(target=super().run)",
        "            thr.setDaemon(True)",
        "            thr.start()",
        "            self.tkplot.tk.mainloop()",
        "        else:",
        "            super().run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "topovis/common.py",
      "kind": "Visualization",
      "group": "Drawing primitives",
      "lines": [
        "import math",
        "",
        "# Constants",
        "DEFAULT=-1",
        "ENABLED=1",
        "DISABLED=0",
        "INF=1e38",
        "NINF=-1e38",
        "",
        "###############################################",
        "class Color:",
        "   def __init__(self,s):",
        "      if type(s) is str:",
        "         self.rgb = tuple(float(x) for x in s.split(','))",
        "      elif type(s) is tuple:",
        "         self.rgb = s",
        "",
        "   def __getitem__(self,x):",
        "      return self.rgb[x]",
        "",
        "   def __str__(self):",
        "      return ','.join(str(x) for x in self.rgb)",
        "",
        "###############################################",
        "class LineStyle(object):",
        "    \"\"\"",
        "    Define a set of attributes for line drawing.  Attributes currently",
        "    supported are",
        "        - color: specifies color in (r,g,b) tuple, where 0 <= r,g,b <= 1",
        "        - dash:  can be either one of the following formats, (), (s,),",
        "          (s1,s2).  The first one results in a solid line; the second results",
        "          in a line drawn with the length of s and skip for the same amount;",
        "          the last will draw the line for the length of s1 and skip for s2.",
        "          However, the actual behavior depends on the plotter.",
        "        - width: speficies the width of the line",
        "        - arrow: specifies how arrow heads are drawn.  Acceptable values are",
        "          'head', 'tail', 'both', and 'none'.",
        "    \"\"\"",
        "    def __init__(self, **kwargs):",
        "        self.color = (0,0,0)",
        "        self.dash = ()",
        "        self.width = 1",
        "        self.arrow = 'none'",
        "        for (k,v) in kwargs.items():",
        "            if k in ['color', 'dash', 'width', 'arrow']:",
        "                setattr(self, k, v)",
        "            else:",
        "                raise Exception('Unknown option \"%s\"' % k)",
        "",
        "    def __repr__(self):",
        "        return '[color=%s,dash=%s,width=%s,arrow=%s]' % (",
        "                self.color, self.dash, self.width, self.arrow)",
        "",
        "###############################################",
        "class FillStyle(object):",
        "    \"\"\"",
        "    Define a set of attributes for shape filling.  The only attribute currently",
        "    supported is 'color', which specifies color in (r,g,b) tuple, where 0 <=",
        "    r,g,b <= 1",
        "    \"\"\"",
        "    def __init__(self, **kwargs):",
        "        self.color = None",
        "        for (k,v) in kwargs.items():",
        "            if k in ['color']:",
        "                setattr(self, k, v)",
        "            else:",
        "                raise Exception('Unknown option \"%s\"' % k)",
        "",
        "    def __repr__(self):",
        "        return '[color=%s]' % self.color",
        "",
        "###############################################",
        "class TextStyle(object):",
        "    \"\"\"",
        "    Define a set of attributes for text rendering.  Attributes currently",
        "    supported are 'color', 'font', and 'size'.",
        "    \"\"\"",
        "    def __init__(self, **kwargs):",
        "        self.color = (0,0,0)",
        "        for (k,v) in kwargs.items():",
        "            if k in ['color', 'font', 'size']:",
        "                setattr(self, k, v)",
        "            else:",
        "                raise Exception('Unknown option \"%s\"' % k)",
        "",
        "###############################################",
        "class Parameters:",
        "",
        "   #########################",
        "   def __init__(self):",
        "      self.margin     = 72",
        "      self.scale      = 1.0",
        "      self.nodesize   = 10",
        "      self.textsize   = 12",
        "      self.hollow     = True",
        "      self.double     = False",
        "      self.nodewidth  = 1",
        "      self.grid       = 0",
        "      self.bgcolor    = Color('1.0,1.0,1.0')",
        "      self.gridcolor  = Color('0.5,0.5,0.5')",
        "      self.nodecolor  = Color('0.0,0.0,0.0')",
        "      self.guard      = self.nodesize",
        "      self.timescale  = 1",
        "",
        "",
        "###############################################",
        "def computeLinkEndPoints(src, dst, nodesize):",
        "   \"Computes both endpoints of a link to be drawn between src and dst\"",
        "",
        "   dx = dst.pos[0] - src.pos[0]",
        "   dy = dst.pos[1] - src.pos[1]",
        "   dist = math.sqrt(dx*dx + dy*dy);",
        "",
        "   # Check if src and dst are on the exact same location",
        "   if (dist == 0.0):",
        "       return dst.pos[0],dst.pos[1],dst.pos[0],dst.pos[1]",
        "",
        "   ux = dx/dist;",
        "   uy = dy/dist;",
        "   newsrcx = src.pos[0] + (ux * nodesize * src.scale);",
        "   newsrcy = src.pos[1] + (uy * nodesize * src.scale);",
        "   newdstx = dst.pos[0] - (ux * nodesize * dst.scale);",
        "   newdsty = dst.pos[1] - (uy * nodesize * dst.scale);",
        "",
        "   return (newsrcx, newsrcy, newdstx, newdsty)"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "topovis/TopoVis.py",
      "kind": "Visualization",
      "group": "Scene model",
      "lines": [
        "from time import sleep, time as systime",
        "from threading import Timer",
        "from heapq import heappush, heappop",
        "import inspect",
        "",
        "from .common import *",
        "",
        "",
        "###############################################",
        "class Node:",
        "    \"\"\"",
        "    Define a dummy node structure to keep track of arbitrary node attributes",
        "    \"\"\"",
        "    pass",
        "",
        "###############################################",
        "class GenericPlotter:",
        "    \"\"\"",
        "    Define a generic plotter class from which actual plotters are derived",
        "    \"\"\"",
        "    def __init__(self, params=None):",
        "        if params is None: params = Parameters()",
        "        self.params = params",
        "        self.scene  = None",
        "",
        "    ###################",
        "    def setScene(self, scene):",
        "        self.scene = scene",
        "",
        "    #######################################################",
        "    # The following methods are supposed to be overridden",
        "    #######################################################",
        "    def init(self,tx,ty): pass",
        "    def setTime(self, time): pass",
        "    def node(self,id,x,y): pass",
        "    def nodemove(self,id,x,y): pass",
        "    def nodehollow(self,id,flag): pass",
        "    def nodedouble(self,id,flag): pass",
        "    def nodecolor(self,id,r,g,b): pass",
        "    def nodewidth(self,id,width): pass",
        "    def nodelabel(self,id,label): pass",
        "    def nodescale(self,id,scale): pass",
        "    def addlink(self,src,dst,style): pass",
        "    def dellink(self,src,dst,style): pass",
        "    def clearlinks(self): pass",
        "    def show(self): pass",
        "    def circle(self,x,y,r,id,linestyle,fillstyle): pass",
        "    def line(self,x1,y1,x2,y2,id,linestyle): pass",
        "    def rect(self,x1,y1,x2,y2,id,linestyle,fillstyle): pass",
        "    def delshape(self,id): pass",
        "    def linestyle(self,id,**kwargs): pass",
        "    def fillstyle(self,id,**kwargs): pass",
        "    def textstyle(self,id,**kwargs): pass",
        "",
        "###############################################",
        "def informPlotters(_func_):",
        "    \"\"\"",
        "    Invoke the instance method of the same name inside each of the registered",
        "    plotters ",
        "    \"\"\"",
        "    def _wrap_(self, *args, **kwargs):",
        "        _func_(self, *args, **kwargs)",
        "        for plotter in self.plotters:",
        "            plotter_func = getattr(plotter, _func_.__name__)",
        "            plotter_func(*args, **kwargs)",
        "",
        "    # code snippet for preserving function's name, doc, and signature",
        "    # (from http://numericalrecipes.wordpress.com/2009/05/25/signature-preserving-function-decorators/)",
        "    sig = list(inspect.getargspec(_func_))",
        "    wrap_sig = list(inspect.getargspec(_wrap_))",
        "    if not sig[2] :",
        "        sig[2] = wrap_sig[2]",
        "    src =  'def %s%s :\\n' %(_func_.__name__, inspect.formatargspec(*sig))",
        "    sig[3] = None # if not, all vars with defaults are set to default value",
        "    src += '    return _wrap_%s\\n' % (inspect.formatargspec(*sig))",
        "    evaldict = {'_wrap_' : _wrap_}",
        "    code = compile(src, '<string>', 'single')",
        "    #exec code in evaldict  # Python2",
        "    exec(code,evaldict)  # Python3",
        "    ret = evaldict[_func_.__name__]",
        "    ret.__doc__ = _func_.__doc__",
        "    return ret",
        "",
        "###############################################",
        "class Scene:",
        "    \"\"\"",
        "    Define a scene that keeps track of every object in the model.  It also",
        "    triggers registered plotters whenever there is a state change.",
        "    \"\"\"",
        "",
        "    ###################",
        "    def __init__(self,timescale=1,realtime=False):",
        "        \"\"\"",
        "        Instantiate a Scene object.  The timescale parameter indicates how",
        "        TopoVis should adjust time delay as specified with a scene scripting",
        "        command.  When the realtime parameter is True, the timescale parameter",
        "        is ignored and each scene scripting command will take effect",
        "        immediately once invoked.",
        "        \"\"\"",
        "        self.plotters = []",
        "        self.time = 0.0",
        "        self.initialized = False",
        "        self.timescale = timescale",
        "        self.realtime = realtime",
        "        self.evq = []        # Event queue",
        "        self.uniqueId = 0    # Counter for generating unique IDs",
        "",
        "        self.dim = (0,0)     # Terrain dimension",
        "        self.nodes = {}      # Nodes' information",
        "        self.links = set()   # Set of links between nodes",
        "        self.lineStyles = {} # List of defined line styles",
        "        self.fillStyles = {} # List of defined fill styles",
        "        self.textStyles = {} # List of defined text styles",
        "",
        "        if realtime:",
        "            self.startTime = systime()",
        "",
        "    ###################",
        "    def setTiming(self, scale=1, realtime=False):",
        "        self.timescale = scale",
        "        self.realtime = realtime",
        "        if realtime:",
        "            self.startTime = systime() - self.time",
        "",
        "    ###################",
        "    def _getUniqueId(self):",
        "        \"\"\"",
        "        Create and return a unique integer everytime it gets called",
        "        \"\"\"",
        "        self.uniqueId = self.uniqueId + 1",
        "        return \"_\" + str(self.uniqueId)",
        "",
        "    ###################",
        "    def addPlotter(self, plotter):",
        "        \"\"\"",
        "        Add a plotter which accepts and visualizes scene scripts",
        "        \"\"\"",
        "        plotter.setScene(self)",
        "        self.plotters.append(plotter)",
        "",
        "    ###################",
        "    def removePlotter(self, plotter):",
        "        \"\"\"",
        "        Remove the specified plotter from keeping track of scene scripts",
        "        \"\"\"",
        "        self.plotters.remove(plotter)",
        "",
        "    ###################",
        "    def execute(self, time, cmd, *args, **kwargs):",
        "        \"\"\"",
        "        Execute the scene scripting command, cmd, with specified",
        "        variable-length and keyword arguments",
        "        \"\"\"",
        "        if self.realtime:",
        "            self.setTime(systime()-self.startTime)",
        "        else:",
        "            # examine the event queue and execute everything prior to",
        "            # the 'current time'",
        "            while len(self.evq) > 0 and self.evq[0][0] < time:",
        "                (t,proc,a,kw) = heappop(self.evq)",
        "                self.setTime(t)",
        "                proc(*a,**kw)",
        "            self.setTime(time)",
        "        if type(cmd) is str:",
        "            #exec 'self.' + cmd    # Python2",
        "            exec('self.' + cmd)  # Python3",
        "        else:",
        "            cmd(*args, **kwargs)",
        "",
        "    ###################",
        "    def executeAfter(self, delay, cmd, *args, **kwargs):",
        "        \"\"\"",
        "        (Use internally) Wait until the specified delay, then executed the given",
        "        command",
        "        \"\"\"",
        "        if delay is INF:",
        "            # no need to scedule any execution at time infinity",
        "            return",
        "        if self.realtime:",
        "            def execfn():",
        "                self.execute(0, cmd, *args, **kwargs)",
        "            Timer(delay, execfn).start()",
        "        else:",
        "            heappush(self.evq, (self.time+delay, cmd, args, kwargs))",
        "",
        "    ###################",
        "    def setTime(self,time):",
        "        \"\"\"",
        "        Set the current time being tracked by TopoVis to the specified time.",
        "        A corresponding amount of delay will be applied unless TopoVis scene",
        "        was instantiated to run in real-time.  This method also informs all",
        "        registered plotters about the updated time so that a label or window",
        "        title can be updated accordingly.",
        "        \"\"\"",
        "        if time < self.time:",
        "            raise Exception(",
        "                    'Time cannot flow backward: current = %.3f, new = %.3f'",
        "                    % (self.time, time)",
        "                    )",
        "        if not self.realtime:",
        "            sleep((time-self.time)*self.timescale)",
        "            self.time = time",
        "        for plotter in self.plotters:",
        "            plotter.setTime(time)",
        "",
        "    ###################",
        "    @informPlotters",
        "    def init(self,tx,ty):",
        "        \"\"\"",
        "        (Scene scripting command) Intialize the scene.  This command should",
        "        be called before any other scripting commands.",
        "        \"\"\"",
        "        if (self.initialized):",
        "            raise Exception('init() has already been called')",
        "        self.dim = (tx,ty)",
        "        self.initialized = True",
        "",
        "",
        "    #########################################################################",
        "    # All methods below define Scene Scripting Commands.  These commands also",
        "    # inform all registered plotters to update visualization of the current",
        "    # scene",
        "    #########################################################################",
        "",
        "    ###################",
        "    @informPlotters",
        "    def node(self,id,x,y):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Define a node with the specified ID and location (x,y)",
        "        \"\"\"",
        "        self.nodes[id]        = Node()",
        "        self.nodes[id].id     = id",
        "        self.nodes[id].pos    = (x,y)",
        "        self.nodes[id].scale  = 1.0",
        "        self.nodes[id].label  = str(id)",
        "        self.nodes[id].hollow = DEFAULT",
        "        self.nodes[id].double = DEFAULT",
        "        self.nodes[id].width  = DEFAULT",
        "        self.nodes[id].color  = DEFAULT",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodemove(self,id,x,y):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Move a node whose ID is id to a new location (x,y)",
        "        \"\"\"",
        "        self.nodes[id].pos = (x,y)",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodecolor(self,id,r,g,b):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set color (in rgb format, 0 <= r,g,b <= 1) of the node, specified by",
        "        id",
        "        \"\"\"",
        "        self.nodes[id].color = (r,g,b)",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodelabel(self,id,label):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set string label for the node, specified by id",
        "        \"\"\"",
        "        self.nodes[id].label = label",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodescale(self,id,scale):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set node scaling factor.  By default, nodes are visualized with",
        "        scale=1",
        "        \"\"\"",
        "        self.nodes[id].scale = scale",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodehollow(self,id,flag):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set node's hollow display",
        "        \"\"\"",
        "        self.nodes[id].hollow = flag",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodedouble(self,id,flag):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set node's double-outline display",
        "        \"\"\"",
        "        self.nodes[id].double = flag",
        "",
        "    ###################",
        "    @informPlotters",
        "    def nodewidth(self,id,width):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Set node's outline width",
        "        \"\"\"",
        "        self.nodes[id].width = width",
        "",
        "    ###################",
        "    @informPlotters",
        "    def addlink(self,src,dst,style):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Add a link with the specified style, which is an instance of",
        "        LineStyle, between a pair of nodes",
        "        \"\"\"",
        "        if style == 'edge' and src > dst:",
        "            src, dst = dst, src",
        "        self.links.add((src,dst,style))",
        "",
        "    ###################",
        "    @informPlotters",
        "    def dellink(self,src,dst,style):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Remove a link with the specified style from a pair of nodes",
        "        \"\"\"",
        "        if style == 'edge' and src > dst:",
        "            src, dst = dst, src",
        "        self.links.remove((src,dst,style))",
        "",
        "    ###################",
        "    @informPlotters",
        "    def clearlinks(self):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Delete all links previously added",
        "        \"\"\"",
        "        self.links.clear()",
        "",
        "    ###################",
        "    @informPlotters",
        "    def show(self):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Force update of topology view",
        "        \"\"\"",
        "        pass",
        "",
        "    ###################",
        "    def circle(self,x,y,r,id=None,line=LineStyle(),fill=FillStyle(),delay=INF):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Draw/update a circle centered at (x,y) with radius r.  line and fill",
        "        are applied to the drawn object.  The object will remain on the scene",
        "        for the specified delay.",
        "        \"\"\"",
        "        # resolve id and inform plotters manually",
        "        # XXX will try to use decorator later on",
        "        if id == None:",
        "            id = self._getUniqueId()",
        "        if not isinstance(line,LineStyle):",
        "            line = self.lineStyles[line]",
        "        if not isinstance(fill,FillStyle):",
        "            fill = self.fillStyles[fill]",
        "        for plotter in self.plotters:",
        "            plotter.circle(x, y, r, id, line, fill)",
        "        if delay != INF:",
        "            self.executeAfter(delay, self.delshape, id)",
        "        else:",
        "            return id",
        "",
        "    ###################",
        "    def line(self,x1,y1,x2,y2,id=None,line=LineStyle(),delay=INF):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Draw/update a line from (x1,y1) to (x2,y2).  line and fill",
        "        are applied to the drawn object.  The object will remain on the scene",
        "        for the specified delay.",
        "",
        "        \"\"\"",
        "        # resolve id and inform plotters manually",
        "        # XXX will try to use decorator later on",
        "        if id == None:",
        "            id = self._getUniqueId()",
        "        if not isinstance(line,LineStyle):",
        "            line = self.lineStyles[line]",
        "        for plotter in self.plotters:",
        "            plotter.line(x1, y1, x2, y2, id, line)",
        "        if delay != INF:",
        "            self.executeAfter(delay, self.delshape, id)",
        "        else:",
        "            return id",
        "",
        "    ###################",
        "    def rect(self,x1,y1,x2,y2,id=None,line=LineStyle(),fill=FillStyle(),delay=INF):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Draw/update a rectangle from (x1,y1) to (x2,y2).  line and fill",
        "        are applied to the drawn object.  The object will remain on the scene",
        "        for the specified delay.",
        "",
        "        \"\"\"",
        "        # resolve id and inform plotters manually",
        "        # XXX will try to use decorator later on",
        "        if id == None:",
        "            id = self._getUniqueId()",
        "        if not isinstance(line,LineStyle):",
        "            line = self.lineStyles[line]",
        "        if not isinstance(fill,FillStyle):",
        "            fill = self.fillStyles[fill]",
        "        for plotter in self.plotters:",
        "            plotter.rect(x1, y1, x2, y2, id, line, fill)",
        "        if delay != INF:",
        "            self.executeAfter(delay, self.delshape, id)",
        "        else:",
        "            return id",
        "",
        "    ###################",
        "    @informPlotters",
        "    def delshape(self,id):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Delete an animated shape (e.g., line, circle) previously created with ID id",
        "        \"\"\"",
        "        pass",
        "",
        "    ###################",
        "    @informPlotters",
        "    def linestyle(self,id,**kwargs):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Define or redefine a line style.",
        "        \"\"\"",
        "        self.lineStyles[id] = LineStyle(**kwargs)",
        "",
        "    ###################",
        "    @informPlotters",
        "    def fillstyle(self,id,**kwargs):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Define or redefine a fill style",
        "        \"\"\"",
        "        self.fillStyles[id] = FillStyle(**kwargs)",
        "",
        "    ###################",
        "    @informPlotters",
        "    def textstyle(self,id,**kwargs):",
        "        \"\"\"",
        "        (Scene scripting command)",
        "        Define or redefine a text style",
        "        \"\"\"",
        "        self.textStyles[id] = FillStyle(**kwargs)",
        ""
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "topovis/TkPlotter.py",
      "kind": "Visualization",
      "group": "Tkinter renderer",
      "lines": [
        "from .common import *",
        "try:",
        "    from Tkinter import *",
        "except ImportError:  # could be Python3",
        "    from tkinter import *",
        "from . import GenericPlotter",
        "",
        "arrowMap = { 'head' : LAST, 'tail' : FIRST, 'both' : BOTH, 'none' : NONE }",
        "",
        "def colorStr(color):",
        "    if color == None:",
        "        return ''",
        "    else:",
        "        return '#%02x%02x%02x' % tuple(int(x*255) for x in color)",
        "",
        "###############################################",
        "class Plotter(GenericPlotter):",
        "    def __init__(self, windowTitle='TopoVis', terrain_size=None, params=None):",
        "        GenericPlotter.__init__(self, params)",
        "        self.nodes = {}",
        "        self.links = {}",
        "        self.nodeLinks = {}",
        "        self.lineStyles = {}",
        "        self.shapes = {}",
        "        self.windowTitle = windowTitle",
        "        self.prepareCanvas(terrain_size)",
        "        self.lastShownTime = 0",
        "",
        "    ###################",
        "    def prepareCanvas(self,terrain_size=None):",
        "        if terrain_size is not None:",
        "            tx,ty = terrain_size",
        "        else:",
        "            tx,ty = 700,700",
        "        self.tk = Tk()",
        "        self.tk.title(self.windowTitle)",
        "        self.canvas = Canvas(self.tk, width=tx, height=ty)",
        "        self.canvas.pack(fill=BOTH, expand=YES)",
        "        self.timeText = self.canvas.create_text(0,0,text=\"time=0.0\",anchor=NW)",
        "",
        "    ###################",
        "    def setTime(self, time):",
        "        if (time - self.lastShownTime > 0.05):",
        "            self.canvas.itemconfigure(self.timeText, text='Time: %.2fS' % time)",
        "            self.lastShownTime = time",
        "",
        "    ###################",
        "    def updateNodePosAndSize(self,id):",
        "        p = self.params",
        "        c = self.canvas",
        "        if id not in self.nodes.keys():",
        "            node_tag = c.create_oval(0,0,0,0)",
        "            label_tag = c.create_text(0,0,text=str(id))",
        "            self.nodes[id] = (node_tag,label_tag)",
        "        else:",
        "            (node_tag,label_tag) = self.nodes[id]",
        "",
        "        node = self.scene.nodes[id]",
        "        nodesize = node.scale*p.nodesize",
        "        x1 = node.pos[0] - nodesize",
        "        y1 = node.pos[1] - nodesize",
        "        (x2,y2) = (x1 + nodesize*2, y1 + nodesize*2)",
        "        c.coords(node_tag, x1, y1, x2, y2)",
        "        c.coords(label_tag, node.pos)",
        "",
        "        for l in self.nodeLinks[id]:",
        "            self.updateLink(*l)",
        "",
        "    ###################",
        "    def configLine(self,tagOrId,style):",
        "        config = {}",
        "        config['fill']  = colorStr(style.color)",
        "        config['width'] = style.width",
        "        config['arrow'] = arrowMap[style.arrow]",
        "        config['dash']  = style.dash",
        "        self.canvas.itemconfigure(tagOrId,**config)",
        "",
        "    ###################",
        "    def configPolygon(self,tagOrId,lineStyle,fillStyle):",
        "        config = {}",
        "        config['outline'] = colorStr(lineStyle.color)",
        "        config['width']    = lineStyle.width",
        "        config['dash']     = lineStyle.dash",
        "        config['fill']     = colorStr(fillStyle.color)",
        "        self.canvas.itemconfigure(tagOrId,**config)",
        "",
        "    ###################",
        "    def createLink(self,src,dst,style):",
        "        if src is dst:",
        "            raise('Source and destination are the same node')",
        "        p = self.params",
        "        c = self.canvas",
        "        (x1,y1,x2,y2) = computeLinkEndPoints(",
        "                self.scene.nodes[src],",
        "                self.scene.nodes[dst], ",
        "                p.nodesize)",
        "        link_obj = c.create_line(x1, y1, x2, y2, tags='link')",
        "        self.configLine(link_obj, self.scene.lineStyles[style])",
        "        return link_obj",
        "",
        "    ###################",
        "    def updateLink(self,src,dst,style):",
        "        p = self.params",
        "        c = self.canvas",
        "        link_obj = self.links[(src,dst,style)]",
        "        (x1,y1,x2,y2) = computeLinkEndPoints(",
        "                self.scene.nodes[src],",
        "                self.scene.nodes[dst], ",
        "                p.nodesize)",
        "        c.coords(link_obj, x1, y1, x2, y2)",
        "",
        "",
        "    ###################",
        "    def node(self,id,x,y):",
        "        self.nodeLinks[id] = []",
        "        self.updateNodePosAndSize(id)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def nodemove(self,id,x,y):",
        "        self.updateNodePosAndSize(id)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def nodecolor(self,id,r,g,b):",
        "        (node_tag,label_tag) = self.nodes[id]",
        "        self.canvas.itemconfig(node_tag, outline=colorStr((r,g,b)))",
        "        self.canvas.itemconfigure(label_tag, fill=colorStr((r,g,b)))",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def nodewidth(self,id,width):",
        "        (node_tag,label_tag) = self.nodes[id]",
        "        self.canvas.itemconfig(node_tag, width=width)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def nodescale(self,id,scale):",
        "        # scale attribute has been set by TopoVis",
        "        # just update the node",
        "        self.updateNodePosAndSize(id)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def nodelabel(self,id,label):",
        "        (node_tag,label_tag) = self.nodes[id]",
        "        self.canvas.itemconfigure(label_tag, text=self.scene.nodes[id].label)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def addlink(self,src,dst,style):",
        "        if style == 'edge' and src > dst:",
        "            src, dst = dst, src",
        "        self.nodeLinks[src].append((src,dst,style))",
        "        self.nodeLinks[dst].append((src,dst,style))",
        "        self.links[(src,dst,style)] = self.createLink(src, dst, style)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def dellink(self,src,dst,style):",
        "        if style == 'edge' and src > dst:",
        "            src, dst = dst, src",
        "        self.nodeLinks[src].remove((src,dst,style))",
        "        self.nodeLinks[dst].remove((src,dst,style))",
        "        self.canvas.delete(self.links[(src,dst,style)])",
        "        del self.links[(src,dst,style)]",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def clearlinks(self):",
        "        self.canvas.delete('link')",
        "        self.links.clear()",
        "        for n in self.nodes.keys():",
        "            self.nodeLinks[n] = []",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def circle(self,x,y,r,id,linestyle,fillstyle):",
        "        if id in self.shapes.keys():",
        "            self.canvas.delete(self.shapes[id])",
        "            del self.shapes[id]",
        "        self.shapes[id] = self.canvas.create_oval(x-r,y-r,x+r,y+r)",
        "        self.configPolygon(self.shapes[id], linestyle, fillstyle)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def line(self,x1,y1,x2,y2,id,linestyle):",
        "        if id in self.shapes.keys():",
        "            self.canvas.delete(self.shapes[id])",
        "            del self.shapes[id]",
        "        self.shapes[id] = self.canvas.create_line(x1,y1,x2,y2)",
        "        self.configLine(self.shapes[id], linestyle)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def rect(self,x1,y1,x2,y2,id,linestyle,fillstyle):",
        "        if id in self.shapes.keys():",
        "            self.canvas.delete(self.shapes[id])",
        "            del self.shapes[id]",
        "        self.shapes[id] = self.canvas.create_rectangle(x1,y1,x2,y2)",
        "        self.configPolygon(self.shapes[id], linestyle, fillstyle)",
        "        self.tk.update()",
        "",
        "    ###################",
        "    def delshape(self,id):",
        "        if id in self.shapes.keys():",
        "            self.canvas.delete(self.shapes[id])",
        "            self.tk.update()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "topovis/__init__.py",
      "kind": "Visualization",
      "group": "Package exports",
      "lines": [
        "from .TopoVis import *",
        "from .common import Parameters",
        "",
        "__all__ = ['LineStyle', 'FillStyle', 'TextStyle', 'Node', 'Scene',",
        "\t\t'GenericPlotter', 'Parameters']"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "blank_template.py",
      "kind": "Example",
      "group": "Starting template",
      "lines": [
        "import sys",
        "sys.path.insert(1, '.')",
        "from source import DawnSimVis",
        "",
        "",
        "###########################################################",
        "# Override required functions",
        "class Node(DawnSimVis.BaseNode):",
        "",
        "    ###################",
        "    def init(self):",
        "        pass",
        "",
        "    ###################",
        "    def run(self):",
        "        pass",
        "",
        "    ###################",
        "    def on_receive(self, pck):",
        "        pass",
        "",
        "    ###################",
        "    def finish(self):",
        "        pass",
        "",
        "",
        "# create a Simulator object",
        "sim = DawnSimVis.Simulator(",
        "    duration=100,",
        "    timescale=1,",
        "    visual=True,",
        "    terrain_size=(650, 650),",
        "    title='Blank Template')",
        "",
        "# add nodes here",
        "",
        "# start the simulation",
        "sim.run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "flood.py",
      "kind": "Example",
      "group": "Flooding protocol",
      "lines": [
        "import random",
        "import sys",
        "sys.path.insert(1, '.')",
        "from source import DawnSim",
        "",
        "SOURCE = 0",
        "",
        "",
        "###########################################################",
        "class Node(DawnSim.BaseNode):",
        "",
        "    ###################",
        "    def init(self):",
        "        self.flood_received = False",
        "",
        "    ###################",
        "    def run(self):",
        "        if self.id == SOURCE:",
        "            pck = {'example_variable': 5}",
        "            self.cb_flood_send(pck)",
        "            self.flood_received = True",
        "",
        "    ###################",
        "    def on_receive(self, pck):",
        "        if not self.flood_received:",
        "            self.log('Flood msg is received first time.')",
        "            self.set_timer(1, self.cb_flood_send, pck)",
        "            self.flood_received = True",
        "",
        "    ###################",
        "    def cb_flood_send(self, pck):",
        "        self.send(DawnSim.BROADCAST_ADDR, pck)",
        "        self.log('Flood msg is sent.')",
        "",
        "",
        "# setting the simulation",
        "sim = DawnSim.Simulator(",
        "    duration=10,",
        "    timescale=1)",
        "",
        "# adding nodes",
        "sim.add_node(Node, (50,50), 75)",
        "sim.add_node(Node, (50,100), 75)",
        "sim.add_node(Node, (50,150), 75)",
        "sim.add_node(Node, (100,150), 75)",
        "",
        "# start the simulation",
        "sim.run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "flood_vis.py",
      "kind": "Example",
      "group": "Visual flooding",
      "lines": [
        "import random",
        "import sys",
        "sys.path.insert(1, '.')",
        "from source import DawnSimVis",
        "",
        "SOURCE = 0",
        "",
        "",
        "###########################################################",
        "class Node(DawnSimVis.BaseNode):",
        "",
        "    ###################",
        "    def init(self):",
        "        self.flood_received = False",
        "",
        "    ###################",
        "    def run(self):",
        "        if self.id == SOURCE:",
        "            self.change_color(1, 0, 0)",
        "            pck = {'example_variable': 5}",
        "            self.cb_flood_send(pck)",
        "            self.flood_received = True",
        "",
        "    ###################",
        "    def on_receive(self, pck):",
        "        if not self.flood_received:",
        "            self.log('Flood msg is received first time.')",
        "            self.change_color(0, 0, 1)",
        "            self.set_timer(1, self.cb_flood_send, pck)",
        "            self.flood_received = True",
        "",
        "    ###################",
        "    def cb_flood_send(self, pck):",
        "        self.send(DawnSimVis.BROADCAST_ADDR, pck)",
        "        self.log('Flood msg is sent.')",
        "",
        "",
        "###########################################################",
        "def create_network():",
        "    # place nodes over 100x100 grids",
        "    for x in range(10):",
        "        for y in range(10):",
        "            px = 50 + x*60 + random.uniform(-20,20)",
        "            py = 50 + y*60 + random.uniform(-20,20)",
        "            sim.add_node(Node, pos=(px,py), tx_range=75)",
        "",
        "",
        "# setting the simulation",
        "sim = DawnSimVis.Simulator(",
        "    duration=100,",
        "    timescale=1,",
        "    visual=True,",
        "    terrain_size=(650, 650),",
        "    title='Flooding')",
        "",
        "# creating network",
        "create_network()",
        "",
        "# start the simulation",
        "sim.run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "aodv.py",
      "kind": "Example",
      "group": "Simplified AODV",
      "lines": [
        "import random",
        "import sys",
        "sys.path.insert(1, '.')",
        "from source import DawnSim",
        "",
        "SOURCE = 0",
        "DEST = 99",
        "",
        "",
        "###########################################################",
        "class Node(DawnSim.BaseNode):",
        "",
        "    ###################",
        "    def init(self):",
        "        self.prev = None",
        "",
        "    ###################",
        "    def run(self):",
        "        if self.id == SOURCE:",
        "            self.seq_no = 0",
        "            package = {'type': 'RREQ', 'source': self.id}",
        "            self.send(DawnSim.BROADCAST_ADDR, package)",
        "            self.log(f'Started to find path to {DEST}')",
        "",
        "    ###################",
        "    def on_receive(self, pck):",
        "        if pck['type'] == 'RREQ':",
        "            if self.prev is not None: return",
        "            self.log(f\"RREQ received first time from {pck['source']}\")",
        "            self.prev = pck['source']",
        "            if self.id != DEST and self.id != SOURCE:",
        "                self.set_timer(.5, self.timer_rreq_cb)",
        "            elif self.id == DEST:",
        "                self.set_timer(.5, self.timer_rreply_cb)",
        "        elif pck['type'] == 'RREPLY':",
        "            self.log(f\"RREPLY received from {pck['source']}\")",
        "            self.next = pck['source']",
        "            if self.id == SOURCE:",
        "                self.set_timer(2, self.timer_start_data_cb)",
        "            else:",
        "                self.set_timer(.5, self.timer_rreply_cb)",
        "        elif pck['type'] == 'DATA':",
        "            if self.id != DEST:",
        "                self.set_timer(.2, self.timer_forward_data_cb, pck['seq_no'])",
        "            self.log(f\"{pck['seq_no']}'th data received\")",
        "",
        "    ###################",
        "    def timer_rreq_cb(self):",
        "        package = {'type': 'RREQ', 'source': self.id}",
        "        self.send(DawnSim.BROADCAST_ADDR, package)",
        "        self.log('RREQ sent')",
        "",
        "    ###################",
        "    def timer_rreply_cb(self):",
        "        package = {'type': 'RREPLY', 'source': self.id}",
        "        self.send(self.prev, package)",
        "        self.log('RREPLY sent')",
        "",
        "    ###################",
        "    def timer_start_data_cb(self):",
        "        package = {'type': 'DATA', 'source': self.id, 'seq_no': self.seq_no}",
        "        self.seq_no += 1",
        "        self.send(self.next, package)",
        "        self.log(f\"Started to sent {self.seq_no}'th data\")",
        "        self.set_timer(1, self.timer_start_data_cb)",
        "",
        "    ###################",
        "    def timer_forward_data_cb(self, seq_no):",
        "        package = {'type': 'DATA', 'source': self.id, 'seq_no': seq_no}",
        "        self.send(self.next, package)",
        "        self.log(f\"{seq_no}'th data forwarded\")",
        "",
        "",
        "###########################################################",
        "def create_network():",
        "    # place nodes over 100x100 grids",
        "    for x in range(10):",
        "        for y in range(10):",
        "            px = 50 + x * 60 + random.uniform(-20, 20)",
        "            py = 50 + y * 60 + random.uniform(-20, 20)",
        "            sim.add_node(Node, pos=(px, py), tx_range=75)",
        "",
        "",
        "# setting the simulation",
        "sim = DawnSim.Simulator(",
        "    duration=100,",
        "    timescale=1)",
        "",
        "# creating network",
        "create_network()",
        "",
        "# start the simulation",
        "sim.run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "aodv_vis.py",
      "kind": "Example",
      "group": "Visual simplified AODV",
      "lines": [
        "import random",
        "import sys",
        "sys.path.insert(1, '.')",
        "from source import DawnSimVis",
        "",
        "SOURCE = 0",
        "DEST = 99",
        "",
        "",
        "###########################################################",
        "class Node(DawnSimVis.BaseNode):",
        "",
        "    ###################",
        "    def init(self):",
        "        self.prev = None",
        "",
        "    ###################",
        "    def run(self):",
        "        if self.id == SOURCE:",
        "            self.change_color(1, 0, 0)",
        "            self.seq_no = 0",
        "            package = {'type': 'RREQ', 'source': self.id}",
        "            self.send(DawnSimVis.BROADCAST_ADDR, package)",
        "            self.log(f'Started to find path to {DEST}')",
        "        elif self.id == DEST:",
        "            self.change_color(1, 0, 0)",
        "        else:",
        "            self.change_color(.7, .7, .7)",
        "",
        "    ###################",
        "    def on_receive(self, pck):",
        "        if pck['type'] == 'RREQ':",
        "            if self.prev is not None: return",
        "            self.log(f\"RREQ received first time from {pck['source']}\")",
        "            self.prev = pck['source']",
        "            self.scene.addlink(self.prev, self.id, \"prev\")",
        "            if self.id != DEST and self.id != SOURCE:",
        "                self.change_color(0, .7, 0)",
        "                self.set_timer(.5, self.timer_rreq_cb)",
        "            elif self.id == DEST:",
        "                self.set_timer(.5, self.timer_rreply_cb)",
        "        elif pck['type'] == 'RREPLY':",
        "            self.log(f\"RREPLY received from {pck['source']}\")",
        "            self.next = pck['source']",
        "            if self.id == SOURCE:",
        "                self.set_timer(2, self.timer_start_data_cb)",
        "            else:",
        "                self.set_timer(.5, self.timer_rreply_cb)",
        "        elif pck['type'] == 'DATA':",
        "            if self.id != DEST:",
        "                self.set_timer(.2, self.timer_forward_data_cb, pck['seq_no'])",
        "            self.log(f\"{pck['seq_no']}'th data received\")",
        "",
        "    ###################",
        "    def timer_rreq_cb(self):",
        "        package = {'type': 'RREQ', 'source': self.id}",
        "        self.send(DawnSimVis.BROADCAST_ADDR, package)",
        "        self.log('RREQ sent')",
        "",
        "    ###################",
        "    def timer_rreply_cb(self):",
        "        package = {'type': 'RREPLY', 'source': self.id}",
        "        self.send(self.prev, package)",
        "        self.log('RREPLY sent')",
        "",
        "    ###################",
        "    def timer_start_data_cb(self):",
        "        package = {'type': 'DATA', 'source': self.id, 'seq_no': self.seq_no}",
        "        self.seq_no += 1",
        "        self.send(self.next, package)",
        "        self.log(f\"Started to sent {self.seq_no}'th data\")",
        "        self.set_timer(1, self.timer_start_data_cb)",
        "",
        "    ###################",
        "    def timer_forward_data_cb(self, seq_no):",
        "        package = {'type': 'DATA', 'source': self.id, 'seq_no': seq_no}",
        "        self.send(self.next, package)",
        "        self.log(f\"{seq_no}'th data forwarded\")",
        "",
        "",
        "###########################################################",
        "def create_network():",
        "    # place nodes over 100x100 grids",
        "    for x in range(10):",
        "        for y in range(10):",
        "            px = 50 + x * 60 + random.uniform(-20, 20)",
        "            py = 50 + y * 60 + random.uniform(-20, 20)",
        "            sim.add_node(Node, pos=(px, py), tx_range=75)",
        "",
        "",
        "# setting the simulation",
        "sim = DawnSimVis.Simulator(",
        "    duration=100,",
        "    timescale=1,",
        "    visual=True,",
        "    terrain_size=(650, 650),",
        "    title='AODV')",
        "",
        "# creating network",
        "create_network()",
        "",
        "# start the simulation",
        "sim.run()"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "README.md",
      "kind": "Repository",
      "group": "Documentation",
      "lines": [
        "# DAWN-Sim",
        "A Simple Distributed Algorithm Simulator for Research and Teaching. The simulator is based on WsnSimPy. It has also visualized version in it.",
        "",
        "## Pre-requirements",
        "Python version is 3.8",
        "",
        "Install SimPy library",
        "",
        "    pip install simpy",
        "",
        "For graphical interface",
        "",
        "    pip install tkinter",
        "",
        "## Examples",
        "",
        "There are three examples which are flood, flood_vis, and aodv. The flood and flood_vis examples simulate the flooding algorithm. The flood_vis is a visualized version of  the flood example.",
        "The aodv simulates the AODV routing algorithm in the visualized version. Execute them via command line:",
        "",
        "    python -m flood.py",
        "",
        "<img src=\"img/flood.PNG\" alt=\"Flooding Demonstration\">",
        "",
        "    python -m flood_vis.py",
        "",
        "<img src=\"img/flood_vis.PNG\" width=\"300\" alt=\"Flooding Demonstration\">",
        "",
        "    python -m aodv_vis.py",
        "",
        "<img src=\"img/aodv.PNG\" width=\"300\" alt=\"Flooding Demonstration\">",
        "",
        "## How to use",
        "",
        "**Step 1:** Import **`DawnSim`**.",
        "",
        "",
        "    from source import DownSim",
        "",
        "**Step 2:** Create a node class that inherits **`DawnSim.BaseNode`** to simulate a single node.",
        "",
        "",
        "    class MyNode(DownSim.BaseNode):",
        "        pass",
        "",
        "**Step 3:** Override **`init()`**, **`run()`**, **`on_receive(pck)`**, and **`finish()`** functions (only the necessary ones).",
        "",
        "",
        "    class MyNode(DownSim.BaseNode):",
        "        def run():",
        "            pck = {'var1': 'val1', 'var2', 'val2'}",
        "            self.send(DawnSim.BROADCAST_ADDR, pck)",
        "",
        "**Step 4:** Create a new **`DawnSim.Simulator`** object.",
        "",
        "",
        "    my_sim = DawnSim(duration = 100)",
        "",
        "**Step 5:** Add nodes into the simulator via **`add_node()`** function.",
        "",
        "",
        "    my_sim.add_node(MyNode, pos = (50, 50), tx_range = 75)",
        "    my_sim.add_node(MyNode, pos = (50, 100), tx_range = 75)",
        "",
        "**Step 6:** Call the **`run()`** to start the simulation.",
        "",
        "",
        "    my_sim.run()",
        "",
        "## Citation",
        "",
        "    Tosun, M., Cabuk, U. C., Dagdeviren, O., & Ozturk, Y. (2023, February). DAWN-Sim: A Distributed Algorithm Simulator for Wireless Ad-hoc Networks in Python. In 2023 International Conference on Computing, Networking and Communications (ICNC). IEEE."
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": "LICENSE",
      "kind": "Repository",
      "group": "License",
      "lines": [
        "Copyright (c) 2018, Chaiporn Jaikaeo",
        "All rights reserved.",
        "",
        "Redistribution and use in source and binary forms, with or without",
        "modification, are permitted provided that the following conditions are met:",
        "",
        "* Redistributions of source code must retain the above copyright notice, this",
        "  list of conditions and the following disclaimer.",
        "",
        "* Redistributions in binary form must reproduce the above copyright notice,",
        "  this list of conditions and the following disclaimer in the documentation",
        "  and/or other materials provided with the distribution.",
        "",
        "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\"",
        "AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE",
        "IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE",
        "DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE",
        "FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL",
        "DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR",
        "SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER",
        "CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,",
        "OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE",
        "OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.",
        "",
        "BSD 2-Clause License",
        "",
        "Copyright (c) 2022, Mustafa Tosun",
        "All rights reserved.",
        "",
        "Redistribution and use in source and binary forms, with or without",
        "modification, are permitted provided that the following conditions are met:",
        "",
        "1. Redistributions of source code must retain the above copyright notice, this",
        "   list of conditions and the following disclaimer.",
        "",
        "2. Redistributions in binary form must reproduce the above copyright notice,",
        "   this list of conditions and the following disclaimer in the documentation",
        "   and/or other materials provided with the distribution.",
        "",
        "THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\"",
        "AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE",
        "IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE",
        "DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE",
        "FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL",
        "DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR",
        "SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER",
        "CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,",
        "OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE",
        "OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    },
    {
      "file": ".gitignore",
      "kind": "Repository",
      "group": "Repository hygiene",
      "lines": [
        "# Byte-compiled / optimized / DLL files",
        "__pycache__/",
        "*.py[cod]",
        "*$py.class",
        "",
        "# C extensions",
        "*.so",
        "",
        "# Distribution / packaging",
        ".Python",
        "build/",
        "develop-eggs/",
        "dist/",
        "downloads/",
        "eggs/",
        ".eggs/",
        "lib/",
        "lib64/",
        "parts/",
        "sdist/",
        "var/",
        "wheels/",
        "pip-wheel-metadata/",
        "share/python-wheels/",
        "*.egg-info/",
        ".installed.cfg",
        "*.egg",
        "MANIFEST",
        "",
        "# PyInstaller",
        "#  Usually these files are written by a python script from a template",
        "#  before PyInstaller builds the exe, so as to inject date/other infos into it.",
        "*.manifest",
        "*.spec",
        "",
        "# Installer logs",
        "pip-log.txt",
        "pip-delete-this-directory.txt",
        "",
        "# Unit test / coverage reports",
        "htmlcov/",
        ".tox/",
        ".nox/",
        ".coverage",
        ".coverage.*",
        ".cache",
        "nosetests.xml",
        "coverage.xml",
        "*.cover",
        "*.py,cover",
        ".hypothesis/",
        ".pytest_cache/",
        "",
        "# Translations",
        "*.mo",
        "*.pot",
        "",
        "# Django stuff:",
        "*.log",
        "local_settings.py",
        "db.sqlite3",
        "db.sqlite3-journal",
        "",
        "# Flask stuff:",
        "instance/",
        ".webassets-cache",
        "",
        "# Scrapy stuff:",
        ".scrapy",
        "",
        "# Sphinx documentation",
        "docs/_build/",
        "",
        "# PyBuilder",
        "target/",
        "",
        "# Jupyter Notebook",
        ".ipynb_checkpoints",
        "",
        "# IPython",
        "profile_default/",
        "ipython_config.py",
        "",
        "# pyenv",
        ".python-version",
        "",
        "# pipenv",
        "#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.",
        "#   However, in case of collaboration, if having platform-specific dependencies or dependencies",
        "#   having no cross-platform support, pipenv may install dependencies that don't work, or not",
        "#   install all needed dependencies.",
        "#Pipfile.lock",
        "",
        "# PEP 582; used by e.g. github.com/David-OConnor/pyflow",
        "__pypackages__/",
        "",
        "# Celery stuff",
        "celerybeat-schedule",
        "celerybeat.pid",
        "",
        "# SageMath parsed files",
        "*.sage.py",
        "",
        "# Environments",
        ".env",
        ".venv",
        "env/",
        "venv/",
        "ENV/",
        "env.bak/",
        "venv.bak/",
        "",
        "# Spyder project settings",
        ".spyderproject",
        ".spyproject",
        "",
        "# Rope project settings",
        ".ropeproject",
        "",
        "# mkdocs documentation",
        "/site",
        "",
        "# mypy",
        ".mypy_cache/",
        ".dmypy.json",
        "dmypy.json",
        "",
        "# Pyre type checker",
        ".pyre/"
      ],
      "annotations": {
        "source/config.py:2": {
          "title": "Broadcast uses an out-of-band address",
          "tags": [
            "Config",
            "Beginner",
            "Cross-file"
          ],
          "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
          "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
          "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
          "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
          "related": [
            "source/DawnSim.py:13",
            "source/DawnSim.py:141",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:19": {
          "title": "Normal callbacks become SimPy-compatible generators",
          "tags": [
            "Core",
            "Advanced",
            "Generator"
          ],
          "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
          "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
          "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
          "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
          "related": [
            "source/DawnSim.py:416",
            "source/DawnSim.py:491"
          ]
        },
        "source/DawnSim.py:35": {
          "title": "Euclidean distance powers radio reach and movement",
          "tags": [
            "Core",
            "Math",
            "Cross-file"
          ],
          "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
          "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
          "why": "One shared helper keeps topology calculations consistent.",
          "related": [
            "source/DawnSim.py:148",
            "source/DawnSim.py:235",
            "source/DawnSim.py:473"
          ]
        },
        "source/DawnSim.py:141": {
          "title": "The radio delivery loop begins here",
          "tags": [
            "Core",
            "Runtime",
            "Important"
          ],
          "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
          "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
          "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
          "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
          "related": [
            "source/DawnSim.py:447",
            "source/config.py:6",
            "flood.py:33"
          ]
        },
        "source/DawnSim.py:164": {
          "title": "A node owns the timers it creates",
          "tags": [
            "Core",
            "Timer",
            "State"
          ],
          "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
          "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
          "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
          "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
          "related": [
            "source/DawnSim.py:322",
            "source/DawnSim.py:181"
          ]
        },
        "source/DawnSim.py:231": {
          "title": "One mobility tick updates position and topology",
          "tags": [
            "Core",
            "Movement",
            "Runtime"
          ],
          "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
          "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
          "why": "Small scheduled increments make connectivity change during a simulation.",
          "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
          "related": [
            "source/config.py:8",
            "source/DawnSim.py:250",
            "source/DawnSim.py:447"
          ]
        },
        "source/DawnSim.py:322": {
          "title": "Timer is a cancellable delayed callback",
          "tags": [
            "Core",
            "Timer",
            "SimPy"
          ],
          "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
          "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
          "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
          "related": [
            "source/DawnSim.py:164",
            "source/DawnSim.py:337"
          ]
        },
        "source/DawnSim.py:371": {
          "title": "Simulator owns the event clock and topology",
          "tags": [
            "Core",
            "Architecture",
            "Important"
          ],
          "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
          "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
          "why": "It centralizes state shared by all nodes.",
          "related": [
            "source/DawnSim.py:385",
            "source/DawnSim.py:431",
            "source/DawnSim.py:483"
          ]
        },
        "source/DawnSim.py:447": {
          "title": "Neighbor lists are kept sorted by distance",
          "tags": [
            "Core",
            "Topology",
            "Advanced"
          ],
          "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
          "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
          "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
          "related": [
            "source/DawnSim.py:102",
            "source/DawnSim.py:145",
            "source/DawnSim.py:235"
          ]
        },
        "source/DawnSim.py:483": {
          "title": "The simulation lifecycle is explicit and ordered",
          "tags": [
            "Core",
            "Lifecycle",
            "Important"
          ],
          "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
          "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
          "why": "The ordering makes sample algorithms predictable and easy to teach.",
          "related": [
            "blank_template.py:11",
            "flood.py:16",
            "source/DawnSim.py:19"
          ]
        },
        "source/DawnSimVis.py:119": {
          "title": "The visual simulator layers rendering over the same engine",
          "tags": [
            "Visualization",
            "Architecture",
            "Threading"
          ],
          "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
          "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
          "why": "Examples can choose visual behavior without duplicating the event engine.",
          "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
          "related": [
            "source/DawnSimVis.py:197",
            "topovis/TopoVis.py:85",
            "topovis/TkPlotter.py:17"
          ]
        },
        "topovis/TopoVis.py:56": {
          "title": "A decorator forwards scene changes to renderers",
          "tags": [
            "Visualization",
            "Decorator",
            "Legacy"
          ],
          "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
          "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
          "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
          "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
          "related": [
            "topovis/TopoVis.py:134",
            "topovis/TkPlotter.py:114"
          ]
        },
        "source/config.py:6": {
          "title": "Delay mode is global module state",
          "tags": [
            "Config",
            "Runtime",
            "Issue"
          ],
          "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
          "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
          "why": "A small teaching simulator can expose configuration as simple constants.",
          "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
          "related": [
            "source/DawnSim.py:150",
            "source/config.py:7"
          ]
        },
        "README.md:27": {
          "title": "Documentation diverges from the checked-in API",
          "tags": [
            "Repository",
            "Documentation",
            "Issue"
          ],
          "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
          "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
          "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
          "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
          "related": [
            "flood.py:4",
            "source/DawnSim.py:371"
          ]
        }
      }
    }
  ],
  "annotations": {
    "source/config.py:2": {
      "title": "Broadcast uses an out-of-band address",
      "tags": [
        "Config",
        "Beginner",
        "Cross-file"
      ],
      "quick": "`BROADCAST_ADDR` is a module-level, constant-like Python name assigned the integer sentinel `-1`.",
      "deep": "Node IDs are allocated from `0` upward by `Simulator.add_node()`, so `-1` cannot collide with a normal node ID. `BaseNode.send()` compares its `dest` argument with this value: equality means every currently in-range neighbor qualifies, not every node in the simulation.",
      "why": "A sentinel keeps the public send API small: `send(-1, packet)` can represent broadcast without a separate broadcast method.",
      "issue": "Python does not enforce constants. A `typing.Final` annotation or an enum would communicate intent more explicitly, but the current integer is cheap and works with the simple ID model.",
      "related": [
        "source/DawnSim.py:13",
        "source/DawnSim.py:141",
        "flood.py:33"
      ]
    },
    "source/DawnSim.py:19": {
      "title": "Normal callbacks become SimPy-compatible generators",
      "tags": [
        "Core",
        "Advanced",
        "Generator"
      ],
      "quick": "`ensure_generator()` accepts either a generator function or an ordinary callback and returns a generator object in both cases.",
      "deep": "SimPy process APIs expect an iterable generator. `inspect.isgeneratorfunction(func)` checks the function definition without executing it. If the callback is ordinary, the nested `_wrapper` calls it and then yields a zero-timeout, making the wrapper a generator function.",
      "why": "Examples can write `run()` either with `yield` or as a plain function; the engine accepts both.",
      "issue": "The wrapper deliberately schedules a zero-timeout after the callback. This is a compatibility adapter, not asynchronous work by itself.",
      "related": [
        "source/DawnSim.py:416",
        "source/DawnSim.py:491"
      ]
    },
    "source/DawnSim.py:35": {
      "title": "Euclidean distance powers radio reach and movement",
      "tags": [
        "Core",
        "Math",
        "Cross-file"
      ],
      "quick": "This helper computes straight-line distance between two `(x, y)` tuples using Pythagoras.",
      "deep": "Tuple indexing obtains x and y. `** 2` squares each coordinate difference; `** 0.5` takes the square root. The result feeds range checks, sorted neighbor lists, propagation delay, and movement ratios.",
      "why": "One shared helper keeps topology calculations consistent.",
      "related": [
        "source/DawnSim.py:148",
        "source/DawnSim.py:235",
        "source/DawnSim.py:473"
      ]
    },
    "source/DawnSim.py:141": {
      "title": "The radio delivery loop begins here",
      "tags": [
        "Core",
        "Runtime",
        "Important"
      ],
      "quick": "`send(dest, pck)` iterates over the sending node’s distance-sorted neighbors and schedules delivery only for eligible receivers.",
      "deep": "The node owns `neighbor_distance_list`; its `Simulator` maintains that list. The packet object is passed by reference to every scheduled receiver. A broadcast destination (`-1`) schedules all neighbors within `tx_range`; a numeric destination schedules only the matching in-range node.",
      "why": "This models a minimal wireless radio abstraction while leaving routing logic in subclasses.",
      "issue": "The same mutable dictionary is handed to every receiver. If one receiver mutates it before another callback runs, later receivers can observe the change. The simulator seed also does not control `random.random()` used for random delay.",
      "related": [
        "source/DawnSim.py:447",
        "source/config.py:6",
        "flood.py:33"
      ]
    },
    "source/DawnSim.py:164": {
      "title": "A node owns the timers it creates",
      "tags": [
        "Core",
        "Timer",
        "State"
      ],
      "quick": "`set_timer()` constructs a `Timer`, saves its reference in `self.timers`, and returns it to the caller.",
      "deep": "The list makes bulk cancellation possible through `kill_all_timers()`. Constructing `Timer` immediately calls `Timer.set()`, which registers its generator with the SimPy environment.",
      "why": "Protocol subclasses can schedule delayed actions without touching SimPy directly.",
      "issue": "Completed timers are not removed from `self.timers`; a long-running protocol that creates many timers can retain completed timer objects.",
      "related": [
        "source/DawnSim.py:322",
        "source/DawnSim.py:181"
      ]
    },
    "source/DawnSim.py:231": {
      "title": "One mobility tick updates position and topology",
      "tags": [
        "Core",
        "Movement",
        "Runtime"
      ],
      "quick": "`move_step()` advances toward `target_pos` by `SIM_MOVE_STEP_TIME × speed`, refreshes neighbors, and schedules another tick if needed.",
      "deep": "It clamps the final step to avoid overshooting. Otherwise it calculates a ratio of desired step length to remaining distance and moves along the vector. Neighbor lists must be recalculated because `send()` relies on their sorted distances.",
      "why": "Small scheduled increments make connectivity change during a simulation.",
      "issue": "Calling `move()` again before a previous movement reaches its target can leave multiple scheduled `move_step()` callbacks active; the newest target is shared state, so those callbacks can interfere.",
      "related": [
        "source/config.py:8",
        "source/DawnSim.py:250",
        "source/DawnSim.py:447"
      ]
    },
    "source/DawnSim.py:322": {
      "title": "Timer is a cancellable delayed callback",
      "tags": [
        "Core",
        "Timer",
        "SimPy"
      ],
      "quick": "`Timer` wraps a callback in a small SimPy process that waits, invokes the callback, or records cancellation.",
      "deep": "`run()` yields `env.timeout(delay)`, suspending its generator until simulation time advances. `kill()` interrupts the process, making the `except simpy.Interrupt` path set `canceled`. `reset()` interrupts then creates a fresh process.",
      "why": "It gives protocol code a familiar timer API without making every example manage process handles.",
      "related": [
        "source/DawnSim.py:164",
        "source/DawnSim.py:337"
      ]
    },
    "source/DawnSim.py:371": {
      "title": "Simulator owns the event clock and topology",
      "tags": [
        "Core",
        "Architecture",
        "Important"
      ],
      "quick": "`Simulator` creates the SimPy real-time environment, node collection, duration, per-instance random object, and timeout shortcut.",
      "deep": "`simpy.rt.RealtimeEnvironment(factor=timescale, strict=False)` couples simulation advancement to wall-clock timing. `nodes` is the authoritative list; IDs are its indices. The `random.Random(seed)` instance exists, but the send path currently uses the module-level generator instead.",
      "why": "It centralizes state shared by all nodes.",
      "related": [
        "source/DawnSim.py:385",
        "source/DawnSim.py:431",
        "source/DawnSim.py:483"
      ]
    },
    "source/DawnSim.py:447": {
      "title": "Neighbor lists are kept sorted by distance",
      "tags": [
        "Core",
        "Topology",
        "Advanced"
      ],
      "quick": "This method removes stale entries involving one affected node, reinserts that node into every other node’s sorted list, then rebuilds the affected node’s own list.",
      "deep": "`bisect.insort` inserts a `(distance, node)` tuple in sorted order. Ties can compare nodes, which is why `BaseNode.__lt__` compares IDs. Sorted lists let `send()` stop at the first distance beyond `tx_range` rather than scan farther nodes.",
      "why": "Node additions and movement change only relationships involving the affected node, so this avoids rebuilding all lists from scratch.",
      "related": [
        "source/DawnSim.py:102",
        "source/DawnSim.py:145",
        "source/DawnSim.py:235"
      ]
    },
    "source/DawnSim.py:483": {
      "title": "The simulation lifecycle is explicit and ordered",
      "tags": [
        "Core",
        "Lifecycle",
        "Important"
      ],
      "quick": "`run()` calls every node’s `init()`, registers every node’s `run()` as a SimPy process, advances until `duration`, then calls every `finish()`.",
      "deep": "This gives protocol authors four hooks: initialize state, begin behavior, react to packets, and clean up. `ensure_generator` permits `run()` to be ordinary or generator-based.",
      "why": "The ordering makes sample algorithms predictable and easy to teach.",
      "related": [
        "blank_template.py:11",
        "flood.py:16",
        "source/DawnSim.py:19"
      ]
    },
    "source/DawnSimVis.py:119": {
      "title": "The visual simulator layers rendering over the same engine",
      "tags": [
        "Visualization",
        "Architecture",
        "Threading"
      ],
      "quick": "`DawnSimVis.Simulator` inherits the core `DawnSim.Simulator` and adds a Scene plus Tkinter Plotter only when `visual` is true.",
      "deep": "The inherited simulator remains the source of simulation state. The visual adapter mirrors node/link operations into `topovis.Scene`, which informs `TkPlotter` and ultimately Tkinter Canvas.",
      "why": "Examples can choose visual behavior without duplicating the event engine.",
      "issue": "`run()` starts the simulation in a background thread while rendering uses the main Tk loop. Simulation-triggered scene updates can reach Tk canvas methods from that background thread; Tkinter thread safety is therefore an architectural concern, not a guarantee of failure.",
      "related": [
        "source/DawnSimVis.py:197",
        "topovis/TopoVis.py:85",
        "topovis/TkPlotter.py:17"
      ]
    },
    "topovis/TopoVis.py:56": {
      "title": "A decorator forwards scene changes to renderers",
      "tags": [
        "Visualization",
        "Decorator",
        "Legacy"
      ],
      "quick": "`informPlotters` wraps Scene commands so each registered plotter receives a matching method call after the Scene updates its own model.",
      "deep": "The wrapper has to preserve a callable signature because it forwards arbitrary arguments. This module uses legacy inspection helpers in its implementation; on modern Python, `inspect.signature()` and `functools.wraps()` are safer replacements.",
      "why": "Scene methods update state once and broadcast the rendering command to every attached plotter.",
      "issue": "The legacy `inspect.getargspec` / `inspect.formatargspec` APIs used by this decorator were removed in Python 3.11, so this source is not portable to current Python without modernization.",
      "related": [
        "topovis/TopoVis.py:134",
        "topovis/TkPlotter.py:114"
      ]
    },
    "source/config.py:6": {
      "title": "Delay mode is global module state",
      "tags": [
        "Config",
        "Runtime",
        "Issue"
      ],
      "quick": "The string `prop` chooses propagation delay in `BaseNode.send()`; `random` chooses a random delay; every other string silently uses the constant-delay branch.",
      "deep": "The misspelled `SIM_MESSAGGING_*` identifier is part of the existing API and must be used exactly as written. Because config is imported as a module, changing it affects every simulator in the Python process.",
      "why": "A small teaching simulator can expose configuration as simple constants.",
      "issue": "Invalid values fall through to constant delay instead of raising an error. Per-simulator configuration would make concurrent simulations safer.",
      "related": [
        "source/DawnSim.py:150",
        "source/config.py:7"
      ]
    },
    "README.md:27": {
      "title": "Documentation diverges from the checked-in API",
      "tags": [
        "Repository",
        "Documentation",
        "Issue"
      ],
      "quick": "The README says `from source import DownSim`, but the repository contains `DawnSim.py` and examples import `from source import DawnSim`.",
      "deep": "The following snippets repeat the typo, omit `self` in `def run()`, use malformed dictionary syntax, and instantiate `DawnSim` rather than `DawnSim.Simulator`.",
      "why": "This line is documentation, not executable code; the tutor preserves it so discrepancies remain visible.",
      "issue": "Treat the example scripts as the authoritative runnable usage until the README is corrected.",
      "related": [
        "flood.py:4",
        "source/DawnSim.py:371"
      ]
    }
  }
};
