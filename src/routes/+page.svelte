<script>
    var stringToColour = function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }

    import cytoscape from 'cytoscape'
    import fcose from 'cytoscape-fcose';

    cytoscape.use( fcose );

	import { onMount } from 'svelte';

    export let data;

    let cyDOM;
    
    const style = [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'width': 'data(size)',
        'height': 'data(size)',
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
    ]

    let options = {
        name: 'fcose',
        // 'draft', 'default' or 'proof' 
        // - "draft" only applies spectral layout 
        // - "default" improves the quality with incremental layout (fast cooling rate)
        // - "proof" improves the quality with incremental layout (slow cooling rate) 
        quality: "proof",
        // Use random node positions at beginning of layout
        // if this is set to false, then quality option must be "proof"
        randomize: true, 
        // Whether or not to animate the layout
        animate: false, 
        // Duration of animation in ms, if enabled
        // animationDuration: 1000, 
        // Easing of animation, if enabled
        // animationEasing: undefined, 
        // Fit the viewport to the repositioned nodes
        fit: true, 
        // Padding around layout
        padding: 30,
        // Whether to include labels in node dimensions. Valid in "proof" quality
        nodeDimensionsIncludeLabels: false,
        // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
        uniformNodeDimensions: false,
        // Whether to pack disconnected components - cytoscape-layout-utilities extension should be registered and initialized
        packComponents: true,
        // Layout step - all, transformed, enforced, cose - for debug purpose only
        step: "all",
        
        /* spectral layout options */
        
        // False for random, true for greedy sampling
        samplingType: true,
        // Sample size to construct distance matrix
        sampleSize: 100,
        // Separation amount between nodes
        nodeSeparation: 300, // 75,
        // Power iteration tolerance
        piTol: 0.0000001,
        /* incremental layout options */
        
        // Node repulsion (non overlapping) multiplier
        nodeRepulsion: node => 5000, // 4500,
        // Ideal edge (non nested) length
        idealEdgeLength: edge => edge.data().length, // 50,
        // Divisor to compute edge forces
        edgeElasticity: edge => 0.45,
        // Nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 0.2, // 0.1,
        // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
        numIter: 10000, // 2500,
        // For enabling tiling
        tile: true,
        // The comparison function to be used while sorting nodes during tiling operation.
        // Takes the ids of 2 nodes that will be compared as a parameter and the default tiling operation is performed when this option is not set.
        // It works similar to ``compareFunction`` parameter of ``Array.prototype.sort()``
        // If node1 is less then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a negative value
        // If node1 is greater then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a positive value
        // If node1 is equal to node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return 0
        tilingCompareBy: undefined, 
        // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
        tilingPaddingVertical: 10,
        // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
        tilingPaddingHorizontal: 10,
        // Gravity force (constant)
        gravity: 0.25,
        // Gravity range (constant) for compounds
        gravityRangeCompound: 1.5,
        // Gravity force (constant) for compounds
        gravityCompound: 1.0,
        // Gravity range (constant)
        gravityRange: 3.8, // 3.8, 
        // Initial cooling factor for incremental layout  
        initialEnergyOnIncremental: 0.3,

        /* constraint options */

        // Fix desired nodes to predefined positions
        // [{nodeId: 'n1', position: {x: 100, y: 200}}, {...}]
        fixedNodeConstraint: undefined,
        // Align desired nodes in vertical/horizontal direction
        // {vertical: [['n1', 'n2'], [...]], horizontal: [['n2', 'n4'], [...]]}
        alignmentConstraint: undefined,
        // Place two nodes relatively in vertical/horizontal direction
        // [{top: 'n1', bottom: 'n2', gap: 100}, {left: 'n3', right: 'n4', gap: 75}, {...}]
        relativePlacementConstraint: undefined,

        /* layout event callbacks */
        ready: () => {}, // on layoutready
        stop: () => {} // on layoutstop
    };

    const prereqs = data.prereqs;

    const courseNodes = Object.keys(prereqs).map(course => {
        return {
            data: {
                id: course,
                label: course,
                color: stringToColour(course.split(' ')[0]),
                size: 25
            }
        }
    })
    const groupNodes = Object.entries(prereqs).map(([course, prereqGroups]) => {
        return prereqGroups.map((_, i) => {
            return {
                data: {
                    id: course + '-' + i,
                    label: i,
                    color: '#777777',
                    size: 5,
                }
            }
        })
    }).flat()
    console.log(groupNodes)

    const groupEdges = Object.entries(prereqs).map(([course, prereqGroups]) => {
        return prereqGroups.map((prereqGroup, i) => {
            return prereqGroup.map(prereq => {
                return {
                    data: {
                        source: prereq.course,
                        target: course + '-' + i,
                        id: prereq.course + '<->' + course + '-' + i,
                        color: '#777777',
                        length: 10
                    }
                }
            })
        })
    }).flat(2)
    const courseEdges = Object.entries(prereqs).map(([course, prereqGroups]) => {
        return prereqGroups.map((prereqGroup, i) => {
            return {
                data: {
                    source: course + '-' + i,
                    target: course,
                    id: course + '-' + i + '<->' + course,
                    color: '#cccccc',
                    length: 150
                }
            }
        })
    }).flat()

    onMount(() => {
        console.log('started')
        const cy = cytoscape({
            // @ts-ignore
            container: cyDOM,
            elements: [
                ...courseNodes,
                ...groupNodes,
                ...groupEdges,
                ...courseEdges
            ],
            style: style
        })
        const layout = cy.layout(options)

        layout.run()
        // setTimeout(() => {
        //     layout.stop()
        //     console.log('stopped')
        // }, 1000 * 10)
    })
    
    // Fetch uiuc-prerequisite.json
</script>
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<div bind:this={cyDOM} style="width: 100%; height: 80vh;">

</div>